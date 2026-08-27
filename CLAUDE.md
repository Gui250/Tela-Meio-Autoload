# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # dev server on :3000
npm run build   # production build (also the only type-check — tsc has noEmit and no script)
npm run lint    # eslint (flat config, next core-web-vitals + typescript)
```

No test suite exists.

## What this is

A single-page kiosk/totem display (pt-BR) for AutoMind's "Autoload" terminal product: an interactive 3D map of a fuel/cargo yard where each operational stage is a clickable hotspot that opens a description and a demo video. There is no backend, no routing beyond `/`, and no data fetching — everything is static config plus assets in `public/`.

## Architecture

Single state atom: `activeStage: Stage | null` lives in `components/StageView.tsx` and drives both halves of the split screen — `PlantMap` (3D canvas, left) and `StagePanel` (text/video, right). Selecting `null` returns to overview.

**The 3D scene is a replay of an external editor's save file.** `config/plant-layout.json` is a v4 backup exported from a separate three.js plant editor (referenced in comments as `contexto/AutoLoad/3d_plant`). `lib/plant-elements.ts` is the only reader of that JSON: it partitions `elements[]` by `type` into named exports (`tankFarms`, `railCars`, `greenery`, …) and maps element types to `.glb` slugs under `public/models/`. `components/PlantMap.tsx` renders those groups. Consequences:

- Each element carries its own `p`/`r`/`s` from the editor. Every renderer must wrap the asset in `<group position={el.p} rotation={el.r} scale={el.s}>` and draw a *nominal, pre-scale* primitive inside — otherwise placement drifts from the source layout.
- Adding a new element type = add it to `MODEL_PATH` in `plant-elements.ts` and drop the model at `public/models/<slug>/model.glb`. Types with no entry (`pista`, `poste_luz`) fall back to procedural geometry in `PlantMap.tsx`.
- Do not hand-edit `plant-layout.json` for cosmetic tweaks; it is a regenerable backup.

**Stage coordinates are world units of that same layout** (`x`, `y` in `config/stages.ts` map to three.js `x`, `z`). `VIEWBOX_*` at the bottom of `stages.ts` is the crop of the 850×950 terrain that actually has activity, and the camera fit math in `PlantMap.tsx` (`useOverviewFactor`, `FIT_MARGIN`, `MAX_FIT`) depends on `VIEWBOX_W`.

**Two derived passes run at module load in `config/stages.ts`** and mutate the exported `stages` array: `stack` ranking (fans overlapping hotspot markers onto poles of different heights — see `CLUSTER_RADIUS`) and `cleanCopy` mojibake repair on titles/descriptions. New stages get both automatically; don't set `stack` by hand.

**Loading is deliberately staged.** `PlantMap` uses two `<Suspense>` boundaries: structural assets (buildings, rail, gates) with a visible fallback, and the heavy shared assets (bushes/trees ~19MB, fuel truck) with `fallback={null}` so they pop in without blocking the yard. `useGLTF.preload` at module top warms the heaviest four. Keep new heavy models in the second boundary.

**Materials need the procedural `<Environment>`.** Exported glTF materials render flat gray without a reflection source; the `Lightformer` rig in `Scene` supplies it with no HDRI fetch. Surfaces still drawn as primitives (ground, sea, roads) get canvas-drawn textures from `lib/canvas-textures.ts` instead of image files.

## Conventions

- Target is a touch totem (portrait 1080×1920) as well as desktop. Interactive elements handle `onPointerDown` with a `pointerType === "touch"` guard *in addition to* `onClick` (see `StagePanel`, `Hotspot3D`) — the drei `<Html>` overlay and OrbitControls swallow taps otherwise. Copy that pattern for new controls inside the canvas.
- All UI copy is Portuguese. All styling is plain CSS in `app/globals.css` (~900 lines, CSS custom properties in `:root`); no Tailwind, no CSS modules.
- Non-obvious geometry/camera decisions are documented in comments explaining *why* the constant has that value. Preserve them when refactoring.
