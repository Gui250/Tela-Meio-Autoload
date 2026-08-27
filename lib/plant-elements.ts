import rawLayout from "@/config/plant-layout.json";

export interface RawElement {
  type: string;
  cat: string;
  name: string;
  p: [number, number, number];
  r: [number, number, number];
  s: [number, number, number];
  color?: number;
  texture?: string;
  alpha?: number;
  pista?: { points: [number, number][]; closed: boolean; width: number };
  rota?: { points: [number, number][] };
}

const layout = rawLayout as unknown as {
  terrain: { groundW: number; groundD: number; seaX: number };
  elements: RawElement[];
};

function byType(type: string) {
  return layout.elements.filter((el) => el.type === type);
}

export const terrain = layout.terrain;

// type -> slug under /public/models/<slug>/model.glb. Types not listed here
// (pista, poste_luz) keep their procedural fallback in PlantMap.tsx.
const MODEL_PATH: Record<string, string> = {
  arvore: "plants/arvore",
  arbusto: "plants/arbusto",
  arbusto_quadrado: "plants/arbusto-quadrado",
  canteiro: "plants/canteiro",
  grade: "objects/grade",
  cancela: "objects/cancela",
  totem: "objects/totem",
  vagas: "objects/vagas",
  bacia: "structures/bacia",
  balanca: "structures/balanca",
  cobertura: "structures/cobertura",
  vistoria: "structures/vistoria",
  cabine_vistoria: "structures/guarita",
  parque_tanques: "structures/parque-tanques",
  truck_center: "structures/truck-center",
  portaria: "structures/portaria",
  vagao: "vehicles/vagao",
  locomotiva: "vehicles/locomotiva",
  navio: "vehicles/navio",
  ferrovia: "structures/ferrovia",
  caminhao_fuel_estatico: "trucks/fuel-truck-style-adapted",
  caminhao_animado: "trucks/fuel-truck-style-adapted",
};

// "factory" scale baked into the library asset itself, applied on top of
// the element's own saved scale (el.s) — mirrors libraryRefs[...].scale
// from the source editor for the couple of assets where it isn't 1.
const MODEL_BASE_SCALE: Record<string, number> = {
  "plants/arvore-grande": 0.12,
};

export function modelPathFor(el: RawElement): string | null {
  if (el.type.startsWith("lib_")) return el.type.slice(4);
  return MODEL_PATH[el.type] ?? null;
}

export function modelBaseScaleFor(path: string): number {
  return MODEL_BASE_SCALE[path] ?? 1;
}

// Each group below is the raw element list for that category. Every 3D
// component places its own <group position={el.p} rotation-y={el.r[1]}
// scale={el.s}> and draws a nominal (pre-scale) primitive inside it — the
// group's transform reproduces the original editor's placement exactly,
// the same way it does in the 3D tool this backup came from.

export const roads = layout.elements.filter((el) => el.pista);
export const basins = byType("bacia");
export const tankFarms = byType("parque_tanques");
export const canopies = byType("cobertura");
export const fencePosts = byType("grade");
export const portaria = byType("portaria")[0] ?? null;
export const cancelas = byType("cancela");
export const totens = byType("totem");
export const weighbridges = byType("balanca");
export const inspectionBooths = [...byType("vistoria"), ...byType("cabine_vistoria")];
export const truckCenter = byType("truck_center")[0] ?? null;
export const parkingBays = byType("vagas");
export const parkedTrucks = byType("caminhao_fuel_estatico");

const wagonsAll = byType("vagao");
export const railCars = wagonsAll.filter((el) => el.p[2] > -200);
export const railLocomotive = byType("locomotiva")[0] ?? null;
// The track bed itself: the real "ferrovia" asset (not a procedural guess),
// same as every other structure. The backup element list includes every
// placed copy — including a far-south one — same as the source editor.
export const railTracks = byType("ferrovia");

export const ship = byType("navio")[0] ?? null;

const routeEl = byType("caminhao_animado")[0];
export const truckRoute = routeEl?.rota ? routeEl.rota.points : [];

export const greenery = layout.elements.filter(
  (el) =>
    el.type === "arvore" ||
    el.type === "arbusto" ||
    el.type === "arbusto_quadrado" ||
    el.type === "canteiro" ||
    el.type.startsWith("lib_plants/")
);

export const lampposts = byType("poste_luz");
export const libraryObjects = layout.elements.filter((el) => el.type.startsWith("lib_objects/"));
