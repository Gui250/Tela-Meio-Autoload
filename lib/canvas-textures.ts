import * as THREE from "three";

// Small procedural surface textures (canvas-drawn, no image assets to fetch)
// for the parts of the plant that are still flat-shaded primitives instead
// of .glb models: ground, sea and road. Ported from the source editor's
// texture style (contexto/AutoLoad/3d_plant/src/core/textures.js) so these
// surfaces read the same way the tank/canopy/rail .glb materials do.

function draw(size: number, fn: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  fn(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeAsphaltTexture() {
  return draw(256, (ctx, size) => {
    ctx.fillStyle = "#2c2c30";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.6 + 0.4;
      const sh = 16 + Math.random() * 60;
      ctx.fillStyle = `rgba(${sh},${sh},${sh + 2},${0.35 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 30 + 14;
      const dark = Math.random() < 0.5;
      ctx.fillStyle = dark ? "rgba(6,6,8,0.22)" : "rgba(80,80,86,0.18)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Moss-toned to fit the dark night scene (matches the layout's
// `theme.groundPattern: "terrain-moss"`) rather than a bright daylight lawn.
export function makeGrassTexture() {
  return draw(256, (ctx, size) => {
    ctx.fillStyle = "#26301f";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 7;
      const g0 = 40 + Math.random() * 30;
      ctx.fillStyle = `rgba(${g0 * 0.6},${g0},${g0 * 0.5},0.28)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const h = 2 + Math.random() * 4;
      ctx.strokeStyle = Math.random() < 0.5 ? "rgba(70,92,48,0.45)" : "rgba(24,32,18,0.4)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 2, y - h);
      ctx.stroke();
    }
  });
}

export function makeConcreteTexture() {
  return draw(256, (ctx, size) => {
    ctx.fillStyle = "#9a968c";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 700; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.3 + 0.3;
      const sh = 130 + Math.random() * 60;
      ctx.fillStyle = `rgba(${sh},${sh - 4},${sh - 12},${0.15 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(70,68,62,0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const x = (size / 3) * (i + Math.random() * 0.3);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
  });
}

// Lighter, less weathered asphalt for freshly paved lots/pátios.
export function makeAsphaltCleanTexture() {
  return draw(256, (ctx, size) => {
    ctx.fillStyle = "#3c3c42";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.4 + 0.3;
      const sh = 55 + Math.random() * 20;
      ctx.fillStyle = `rgba(${sh},${sh},${sh + 2},${0.15 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function makeWaterTexture() {
  return draw(256, (ctx, size) => {
    ctx.fillStyle = "#0d3050";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(180,215,240,0.16)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * size;
      const len = 20 + Math.random() * 60;
      const x = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len / 2, y + (Math.random() - 0.5) * 6, x + len, y);
      ctx.stroke();
    }
    for (let i = 0; i < 250; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,10,20,0.08)";
      ctx.fillRect(x, y, 2, 2);
    }
  });
}

// Maps a saved element's `texture` name (e.g. bacia/pátio ground overlays)
// to its generator. Unknown/missing names fall back to no texture.
const TEXTURE_BY_NAME: Record<string, () => THREE.CanvasTexture> = {
  asphalt: makeAsphaltTexture,
  "asphalt-clean": makeAsphaltCleanTexture,
  concrete: makeConcreteTexture,
  "terrain-moss": makeGrassTexture,
};

export function makeNamedTexture(name?: string) {
  return name ? TEXTURE_BY_NAME[name]?.() ?? null : null;
}
