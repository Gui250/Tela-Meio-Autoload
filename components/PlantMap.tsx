"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Clone, Environment, Html, Lightformer, Line, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { layers, places, placeOf, stageLabel, Stage, VIEWBOX_W } from "@/config/stages";
import { tour as tourChapters } from "@/config/tour";
import { Scenario } from "@/config/scenarios";
import { ImpactStatus, ScenarioResult } from "@/lib/scenario-model";
import { TourController } from "@/lib/use-tour";
import { GuidedTour } from "./GuidedTour";
import { PlayIcon } from "./icons";
import { YardPin } from "./Hotspot3D";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { TourStage } from "./TourStage";
import { makeAsphaltTexture, makeGrassTexture, makeWaterTexture, makeNamedTexture } from "@/lib/canvas-textures";
import {
  terrain,
  roads,
  basins,
  tankFarms,
  canopies,
  fencePosts,
  portaria,
  cancelas,
  totens,
  weighbridges,
  inspectionBooths,
  truckCenter,
  parkingBays,
  parkedTrucks,
  railCars,
  railLocomotive,
  railTracks,
  ship,
  truckRoute,
  greenery,
  lampposts,
  libraryObjects,
  modelPathFor,
  modelBaseScaleFor,
  RawElement,
} from "@/lib/plant-elements";

const COLOR = {
  ground: "#1c1c1c",
  sea: "#123a5c",
  road: "#2a2a2a",
  roadLine: "#f2c230",
  magenta: "#fa094e", // matches --magenta in globals.css
  lamp: "#ffd9a0",
};

// Heaviest / most-repeated assets — start fetching as soon as the module
// loads instead of waiting for their first instance to mount.
["plants/bush-realista", "plants/arvore-grande", "trucks/fuel-truck-style-adapted", "structures/parque-tanques"].forEach(
  (path) => useGLTF.preload(`/models/${path}/model.glb`)
);

// Real .glb model for an element. modelPathFor() resolves the type -> asset
// slug; useGLTF caches by URL, so repeated elements (e.g. 21 bushes) share
// one download/parse and each instance below is a cheap <Clone>.
function Model({ el }: { el: RawElement }) {
  const path = modelPathFor(el);
  if (!path) return null;
  return <ModelInstance el={el} path={path} />;
}

function ModelInstance({ el, path }: { el: RawElement; path: string }) {
  const { scene } = useGLTF(`/models/${path}/model.glb`);
  const baseScale = modelBaseScaleFor(path);
  const scale = useMemo(
    () => el.s.map((s) => s * baseScale) as [number, number, number],
    [el.s, baseScale]
  );
  return (
    <group position={el.p} rotation={el.r}>
      <Clone object={scene} scale={scale} />
    </group>
  );
}

// Bacia elements (basins/pátio ground overlays) carry their own texture,
// color tint and opacity in the saved layout — unlike other .glb elements,
// which just use the model's baked material as-is.
function Basin({ el }: { el: RawElement }) {
  const path = modelPathFor(el);
  const { scene } = useGLTF(`/models/${path}/model.glb`);
  const map = useMemo(() => {
    const t = makeNamedTexture(el.texture);
    if (t) t.repeat.set(Math.max(1, el.s[0] / 2), Math.max(1, el.s[2] / 2));
    return t;
  }, [el.texture, el.s]);
  const object = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = (child.material as THREE.MeshStandardMaterial).clone();
      if (map) mat.map = map;
      if (el.color !== undefined) mat.color = new THREE.Color(el.color);
      if (el.alpha !== undefined) {
        mat.transparent = true;
        mat.opacity = el.alpha;
      }
      child.material = mat;
    });
    return clone;
  }, [scene, map, el.color, el.alpha]);
  return (
    <group position={el.p} rotation={el.r} scale={el.s}>
      <primitive object={object} />
    </group>
  );
}

function Lamppost({ el }: { el: RawElement }) {
  return (
    <group position={el.p} rotation={[0, el.r[1], 0]} scale={el.s}>
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 5.2, 8]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, 5.3, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={COLOR.lamp} emissive={COLOR.lamp} emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0, 5.3, 0]} color={COLOR.lamp} intensity={4} distance={22} decay={2} />
    </group>
  );
}

const OVERVIEW_POSITION = new THREE.Vector3(13, 120, 300);
const OVERVIEW_TARGET = new THREE.Vector3(13, 0, 31);
const FOV = 50;
// The overview has to hold the operational cluster's full width (VIEWBOX_W)
// plus a gap for the hotspot labels. Only width is tested: the camera looks
// down a tilted axis, so the visible ground depth already runs far past the
// frustum's vertical extent — testing height too pulls the camera so far back
// the yard shrinks into the top of the frame over an empty foreground.
const FIT_MARGIN = 1.28;
// Keep the fitted distance inside OrbitControls' maxDistance, or its clamp
// fights the camera lerp on very narrow viewports.
const MAX_FIT = 1.9;

function roadSegments(points: [number, number][], closed: boolean) {
  const segs: { mid: [number, number]; length: number; angle: number }[] = [];
  const count = closed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    segs.push({
      mid: [(x1 + x2) / 2, (z1 + z2) / 2],
      length: Math.hypot(x2 - x1, z2 - z1),
      angle: Math.atan2(z2 - z1, x2 - x1),
    });
  }
  return segs;
}

const TILE = 6; // world units per texture repeat

function Road({ el }: { el: RawElement }) {
  const segs = useMemo(() => roadSegments(el.pista!.points, el.pista!.closed), [el]);
  const width = el.pista!.width;
  const tint = el.color !== undefined ? new THREE.Color(el.color) : undefined;
  // One asphalt texture per segment (independent repeat = each segment's own
  // length), memoized together so it isn't regenerated on unrelated re-renders.
  const asphaltTextures = useMemo(
    () =>
      segs.map((seg) => {
        const t = makeAsphaltTexture();
        t.repeat.set(Math.max(1, seg.length / TILE), Math.max(1, width / TILE));
        return t;
      }),
    [segs, width]
  );
  // Consecutive segments are straight boxes butted together, so any turn
  // leaves a wedge-shaped gap on the outer edge — a round cap at each
  // vertex covers it without needing real mitered geometry.
  const capTexture = useMemo(() => makeAsphaltTexture(), []);
  return (
    <group position={el.p} rotation={[0, el.r[1], 0]} scale={el.s}>
      {segs.map((seg, i) => (
        <mesh key={i} position={[seg.mid[0], 0.04, seg.mid[1]]} rotation={[0, -seg.angle, 0]}>
          <boxGeometry args={[seg.length, 0.08, width]} />
          <meshStandardMaterial map={asphaltTextures[i]} color={tint} roughness={0.95} />
        </mesh>
      ))}
      {(el.pista!.closed ? el.pista!.points : el.pista!.points.slice(1, -1)).map(([x, z], i) => (
        <mesh key={`cap-${i}`} position={[x, 0.04, z]}>
          <cylinderGeometry args={[width / 2, width / 2, 0.08, 20]} />
          <meshStandardMaterial map={capTexture} color={tint} roughness={0.95} />
        </mesh>
      ))}
      {/* Dash/gap scale with each road's own width (from the json) so a wide,
          long road reads as a handful of lane stripes instead of dozens of
          tiny dashes strung along its full length. */}
      <Line
        points={[...el.pista!.points, ...(el.pista!.closed ? [el.pista!.points[0]] : [])].map(([x, z]) => [x, 0.09, z] as [number, number, number])}
        color={COLOR.roadLine}
        dashed
        dashSize={width * 0.6}
        gapSize={width * 1.8}
        lineWidth={2}
      />
    </group>
  );
}

// How far back the overview has to sit for the yard to fit the current pane.
function useOverviewFactor() {
  const aspect = useThree((state) => state.size.width / state.size.height);
  // The overview needs a real fit test, not just a portrait correction: on a
  // 1080x1920 totem the map pane is short and wide (landscape by itself), so a
  // portrait-only check reports "nothing to do" while the yard still overflows.
  return useMemo(() => {
    const baseDist = OVERVIEW_POSITION.distanceTo(OVERVIEW_TARGET);
    const visibleH = 2 * baseDist * Math.tan(((FOV / 2) * Math.PI) / 180);
    return Math.min(MAX_FIT, Math.max(1, (VIEWBOX_W * FIT_MARGIN) / (visibleH * aspect)));
  }, [aspect]);
}

function CameraRig({
  activeStage,
  focus,
  resetKey,
  overviewFactor,
}: {
  activeStage: Stage | null;
  /** Framing for a tour beat that highlights an area with no stage of its own. */
  focus: { x: number; y: number; scale: number } | null;
  resetKey: number;
  overviewFactor: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const followRef = useRef(true);
  const aspect = useThree((state) => state.size.width / state.size.height);
  // FOV is vertical, so a portrait viewport (aspect < 1) sees a narrower
  // horizontal slice at the same distance — pull the camera back proportionally
  // so edge hotspots stay in frame. No-op on landscape/desktop (factor = 1).
  const aspectFactor = aspect < 1 ? 1 / aspect : 1;

  const destination = useMemo(() => {
    // A stage is framed by its place, not by itself: its siblings have to stay
    // on screen, or opening one step of the gatehouse hides the other two.
    // Layer stages have no spot in the yard at all, so the camera holds the
    // overview and the panel does the talking.
    const place = activeStage?.layer ? null : placeOf(activeStage);
    const look = place ? place.zoom : focus;
    if (!look) {
      const dir = OVERVIEW_POSITION.clone().sub(OVERVIEW_TARGET);
      const position = OVERVIEW_TARGET.clone().add(dir.multiplyScalar(overviewFactor));
      return { position, target: OVERVIEW_TARGET };
    }
    const dist = Math.max(55, 220 / look.scale) * aspectFactor;
    return {
      position: new THREE.Vector3(look.x, dist * 0.45, look.y + dist * 0.85),
      target: new THREE.Vector3(look.x, 0, look.y),
    };
  }, [activeStage, focus, aspectFactor, overviewFactor]);

  useEffect(() => {
    followRef.current = true;
  }, [destination]);

  useEffect(() => {
    followRef.current = true;
  }, [resetKey]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const stopFollow = () => {
      followRef.current = false;
    };
    controls.addEventListener("start", stopFollow);
    return () => controls.removeEventListener("start", stopFollow);
  }, []);

  useFrame(({ camera }, delta) => {
    const controls = controlsRef.current;
    if (!controls || !followRef.current) return;
    // Frame-rate-independent ease: converges at the same speed regardless of fps.
    const t = 1 - Math.pow(0.001, delta);
    camera.position.lerp(destination.position, t);
    controls.target.lerp(destination.target, t);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      minDistance={20}
      maxDistance={600}
      enableRotate={false}
      enablePan
      screenSpacePanning
    />
  );
}

function Ground({ onClick }: { onClick: () => void }) {
  const texture = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(terrain.groundW / TILE, terrain.groundD / TILE);
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={onClick}>
      <planeGeometry args={[terrain.groundW, terrain.groundD]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  );
}

function Sea() {
  // seaX is how far the sea reaches in from the map's east edge, not the
  // shoreline's own x — the shoreline sits `seaX` in from that edge. A small
  // extra margin covers the moored ship's hull (its saved position sits a
  // few units short of the raw shoreline) without the water swallowing the
  // rail dock further inland.
  const DOCK_MARGIN = 20;
  const shoreline = terrain.groundW / 2 - terrain.seaX - DOCK_MARGIN;
  const width = terrain.groundW / 2 - shoreline;
  const texture = useMemo(() => {
    const t = makeWaterTexture();
    t.repeat.set(width / TILE, terrain.groundD / TILE);
    return t;
  }, [width]);
  // Read through the material ref inside the frame loop (not the `texture`
  // variable itself) so animating the offset doesn't mutate a useMemo value.
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, delta) => {
    const map = matRef.current?.map;
    if (!map) return;
    map.offset.x += delta * 0.01;
    map.offset.y += delta * 0.006;
  });
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[(shoreline + terrain.groundW / 2) / 2, 0.02, 0]}
    >
      <planeGeometry args={[width, terrain.groundD]} />
      <meshStandardMaterial ref={matRef} map={texture} roughness={0.35} metalness={0.1} transparent opacity={0.92} />
    </mesh>
  );
}

/** A place is only as healthy as its worst station. */
const SEVERITY: Record<ImpactStatus, number> = { ok: 0, atencao: 1, critico: 2 };

function Scene({
  activeStage,
  focus,
  onSelectStage,
  resetKey,
  impactOf,
}: {
  activeStage: Stage | null;
  focus: { x: number; y: number; scale: number } | null;
  onSelectStage: (stage: Stage | null) => void;
  resetKey: number;
  /** Undefined for every stage while no scenario is running. */
  impactOf: (stage: Stage) => ImpactStatus | undefined;
}) {
  const overviewFactor = useOverviewFactor();
  const openPlace = activeStage?.layer ? null : placeOf(activeStage);
  return (
    <>
      <color attach="background" args={["#141414"]} />
      <fog attach="fog" args={["#141414", 260, 900]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[180, 220, 120]} intensity={1.1} />
      <directionalLight position={[-150, 120, -180]} intensity={0.3} />
      {/* glTF materials come out of the exporter as mid metalness/roughness —
          without an environment map to reflect, they render flat gray no
          matter how detailed their baked textures are. Lightformers build
          that map procedurally in-canvas, so the yard keeps rendering with
          no HDRI file to fetch. */}
      <Environment resolution={256}>
        <Lightformer intensity={2.2} color="#dfe6ee" rotation-x={Math.PI / 2} position={[0, 12, 0]} scale={[20, 20, 1]} />
        <Lightformer intensity={0.8} color="#fff3e0" position={[-10, 4, 6]} scale={[10, 4, 1]} />
        <Lightformer intensity={0.6} color="#dfe9f5" position={[10, 4, -6]} rotation-y={Math.PI} scale={[10, 4, 1]} />
      </Environment>

      <CameraRig activeStage={activeStage} focus={focus} resetKey={resetKey} overviewFactor={overviewFactor} />

      {/* ground */}
      <Ground onClick={() => activeStage && onSelectStage(null)} />

      {/* sea */}
      <Sea />

      {/* roads */}
      {roads.map((el, i) => (
        <Road key={i} el={el} />
      ))}

      {/* Structural elements — the yard reads correctly once just these are
          in. Kept off the two heaviest assets below so their download/parse
          time can't block the buildings, gates and rail from appearing. */}
      <Suspense
        fallback={
          <Html center>
            <div className="plant-loading">Carregando modelos…</div>
          </Html>
        }
      >
        {fencePosts.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {railCars.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {railLocomotive && <Model el={railLocomotive} />}
        {railTracks.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {ship && <Model el={ship} />}
        {basins.map((el, i) => (
          <Basin key={i} el={el} />
        ))}
        {tankFarms.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {canopies.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {parkingBays.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {weighbridges.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {inspectionBooths.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {truckCenter && <Model el={truckCenter} />}
        {portaria && <Model el={portaria} />}
        {cancelas.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {totens.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {libraryObjects.map((el, i) => (
          <Model key={i} el={el} />
        ))}
      </Suspense>

      {/* Heaviest assets (21 bushes + big trees sharing one ~19MB model,
          the fuel truck) — their own silent Suspense so a slow parse never
          blocks the structural pass above; they simply pop in once ready. */}
      <Suspense fallback={null}>
        {parkedTrucks.map((el, i) => (
          <Model key={i} el={el} />
        ))}
        {greenery.map((el, i) => (
          <Model key={i} el={el} />
        ))}
      </Suspense>

      {/* light poles */}
      {lampposts.map((el, i) => (
        <Lamppost key={i} el={el} />
      ))}

      {/* recorded truck flow route */}
      {truckRoute.length > 1 && (
        <Line
          points={truckRoute.map(([x, z]) => [x, 0.5, z] as [number, number, number])}
          color={COLOR.magenta}
          dashed
          dashSize={2}
          gapSize={2.5}
          lineWidth={1.5}
          transparent
          opacity={0.6}
        />
      )}

      {/* One pin per place. The open place hands its pin over to its own steps,
          which the camera has by then pulled far enough apart to read. A layer
          stage leaves every pin at full strength — the map is not its subject. */}
      {places.map((place) =>
        place === openPlace ? (
          place.stages.map((stage) => (
            <YardPin
              key={stage.id}
              x={stage.x}
              y={stage.y}
              name={stageLabel(stage)}
              onClick={() => onSelectStage(stage)}
              dimmed={!!activeStage && activeStage.id !== stage.id}
              active={activeStage?.id === stage.id}
              impact={impactOf(stage)}
            />
          ))
        ) : (
          <YardPin
            key={place.id}
            x={place.x}
            y={place.y}
            name={place.stages.length > 1 ? place.label : stageLabel(place.stages[0])}
            note={place.stages.length > 1 ? `${place.stages.length} etapas` : undefined}
            onClick={() => onSelectStage(place.stages[0])}
            muted={!!openPlace}
            dimmed={false}
            active={false}
            impact={place.stages
              .map(impactOf)
              .reduce<ImpactStatus | undefined>((worst, next) => (next && (!worst || SEVERITY[next] > SEVERITY[worst]) ? next : worst), undefined)}
          />
        )
      )}
    </>
  );
}

export function PlantMap({
  activeStage,
  onSelectStage,
  tour,
  scenario,
  result,
}: {
  activeStage: Stage | null;
  onSelectStage: (stage: Stage | null) => void;
  tour: TourController;
  scenario: Scenario;
  result: ScenarioResult;
}) {
  const simulating = scenario.id !== "normal";
  // No scenario running means no impact anywhere, so the pins stay exactly as
  // they were before the simulator existed.
  const impactOf = (stage: Stage) => (simulating ? result.impacts.get(stage.id)?.status : undefined);
  const [resetKey, setResetKey] = useState(0);
  // Clearing the selection is half the job: with a stage still active the rig
  // flies straight back to that stage's zoom, so the button looked inert.
  const resetView = () => {
    onSelectStage(null);
    setResetKey((key) => key + 1);
  };
  // The clip takes the whole screen once the camera has arrived (see
  // TourStage). It renders inside this wrapper on purpose: the wrapper
  // isolates a stacking context, so the fullscreen video and the tour HUD
  // that has to stay above it are ordered against each other and nothing
  // else on the page.
  const cinema = tour.running && tour.videoVisible && activeStage !== null;
  return (
    <div
      className="plant-map-wrapper"
      data-presenting={tour.running || undefined}
      data-cinema={cinema || undefined}
    >
      <div className="map-toolbar" aria-label="Controles do mapa">
        <span className="map-context">
          <span className="map-context-dot" />
          {tour.running && tour.index !== null
            ? `Apresentação · ${tour.index + 1} de ${tourChapters.length}`
            : activeStage
              ? stageLabel(activeStage)
              : "Visão geral do terminal"}
        </span>
        {!tour.running && (
          <span className="map-actions">
            <button className="map-present" onClick={tour.start}>
              <PlayIcon size={13} /> Apresentação
            </button>
            <button className="map-reset" onClick={resetView} aria-label="Voltar à visão geral"><span aria-hidden="true">↗</span> Visão geral</button>
          </span>
        )}
      </div>
      {/* Auditoria and Gestão read across the whole yard rather than happening
          at one spot in it. Pinning them to a borrowed patch of asphalt is what
          made them unreachable; as a pair of controls on the map's own chrome
          they are the largest, plainest targets on the screen. */}
      <div className="map-layers">
        <span className="map-layers-title">Em toda a operação</span>
        <span className="map-layers-set">
          {layers.map((layer) => (
            <button
              type="button"
              key={layer.id}
              className="layer-chip"
              data-active={activeStage?.id === layer.id || undefined}
              onPointerDown={(event) => {
                if (event.pointerType === "touch" || event.pointerType === "pen") {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelectStage(layer);
                }
              }}
              onClick={() => onSelectStage(layer)}
            >
              <span className="layer-chip-mark" aria-hidden="true" />
              {stageLabel(layer)}
            </button>
          ))}
        </span>
      </div>
      {cinema && activeStage && <TourStage stage={activeStage} />}
      <GuidedTour controller={tour} />
      <MapErrorBoundary>
        <Canvas
          className="plant-canvas"
          style={{ position: "absolute", inset: 0 }}
          camera={{ position: OVERVIEW_POSITION.toArray(), fov: 50, near: 1, far: 1400 }}
          onPointerMissed={() => activeStage && onSelectStage(null)}
        >
          <Scene
            activeStage={activeStage}
            focus={tour.step?.focus ?? null}
            onSelectStage={onSelectStage}
            resetKey={resetKey}
            impactOf={impactOf}
          />
        </Canvas>
      </MapErrorBoundary>
    </div>
  );
}

