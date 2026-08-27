export type StageId =
  | "agendamento"
  | "checkin"
  | "pesagem"
  | "inspecao"
  | "carga-descarga"
  | "filas"
  | "estoque"
  | "auditoria"
  | "gestao";

export interface Stage {
  id: StageId;
  title: string;
  /** Marker/chip label. Defaults to the title's part before " - ", which is
      still too long for a few stages at totem viewing distance. */
  short?: string;
  description: string;
  videoSrc: string;
  x: number;
  y: number;
  /** True for a stage that is not a spot in the yard but a reading across the
      whole operation. Layers have no map pin — see `places` below. */
  layer?: true;
  zoom: { x: number; y: number; scale: number };
}

// Coordinates come from the real yard layout (config/plant-layout.json), matched
// to the physical element each stage represents (gatehouse, weighbridge, tank
// farm, etc). Stages with no matching physical asset (auditoria, gestao) are
// placed near the operational cluster they logically belong to.
export const stages: Stage[] = [
  {
    id: "checkin",
    title: "Check In - Check Out",
    short: "Check-In",
    description: "Registro automático de entrada e saída do motorista na portaria, com validação de documentos e liberação de acesso ao pátio em segundos.",
    videoSrc: "/videos/checkin-checkout.mp4",
    x: -106,
    y: 119,
    zoom: { x: -106, y: 119, scale: 3.2 },
  },
  {
    id: "agendamento",
    title: "Agendamento - Etapa Inicial",
    description: "Motoristas e transportadoras agendam a janela de carga com antecedência, reduzindo filas e organizando o fluxo de chegada ao terminal.",
    videoSrc: "/videos/agendamento.mp4",
    // Out on the approach lane, not on top of the gatehouse: the window is
    // booked before the truck arrives, and 12m from check-in the two signs
    // could never be told apart at any framing that also held the yard.
    x: -148,
    y: 134,
    zoom: { x: -148, y: 134, scale: 3.2 },
  },
  {
    id: "filas",
    title: "Controle de Filas",
    description: "Painel de chamada organiza a ordem de atendimento dos caminhões no pátio, priorizando por horário de agendamento e disponibilidade das docas.",
    videoSrc: "/videos/controle-filas.mp4",
    x: -104,
    y: 70,
    zoom: { x: -104, y: 70, scale: 3.2 },
  },
  {
    id: "pesagem",
    title: "Pesagem Inicial e Final",
    short: "Pesagem",
    description: "Pesagem automatizada na entrada e na saída, com captura de peso bruto, tara e líquido integrada diretamente ao sistema operacional.",
    videoSrc: "/videos/pesagem.mp4",
    x: -10,
    y: 58,
    zoom: { x: -10, y: 58, scale: 3.2 },
  },
  {
    id: "inspecao",
    title: "Inspeção - Checklist Digital",
    description: "Checklist digital de inspeção veicular e de carga, com registro fotográfico e liberação condicionada à conformidade dos itens verificados.",
    videoSrc: "/videos/inspecao.mp4",
    x: 122,
    y: 102,
    zoom: { x: 122, y: 102, scale: 3.2 },
  },
  {
    id: "carga-descarga",
    title: "Carga e Descarga - Dashboards e Telemetria",
    description: "Acompanhamento em tempo real da carga e descarga por telemetria, com dashboards de vazão, tempo de doca e status de cada operação.",
    videoSrc: "/videos/carga-descarga.mp4",
    x: 149,
    y: 15,
    zoom: { x: 149, y: 15, scale: 3.2 },
  },
  {
    id: "estoque",
    title: "Estoque - Inventário e Tancagem",
    description: "Controle de inventário e tancagem com leitura contínua de níveis, permitindo rastrear disponibilidade de produto por tanque em tempo real.",
    videoSrc: "/videos/estoque.mp4",
    x: 55,
    y: -20,
    zoom: { x: 55, y: -20, scale: 3.2 },
  },
  {
    id: "auditoria",
    layer: true,
    title: "Auditoria - Registros e Rastreabilidade",
    description: "Trilha de auditoria completa de cada movimentação, com registros e evidências rastreáveis para conferência e compliance.",
    videoSrc: "/videos/auditoria.mp4",
    x: -90,
    y: 145,
    zoom: { x: -90, y: 145, scale: 3.2 },
  },
  {
    id: "gestao",
    layer: true,
    title: "Dashboard de Gestão - Acompanhamento de movimentações",
    short: "Gestão",
    description: "Dashboard de gestão consolida indicadores de todas as etapas da operação, dando visibilidade ponta a ponta do pátio para a liderança.",
    videoSrc: "/videos/dashboard-gestao.mp4",
    x: -80,
    y: 55,
    zoom: { x: -80, y: 55, scale: 3.2 },
  },
];

// Five stages sat within 70m of the gatehouse. Fanning their markers up poles
// to keep them apart built a tower that ran off the top of a short map pane —
// the deepest marker was unclickable. The yard's own answer is simpler: a
// terminal has *places*, and a place can hold more than one step. The map shows
// one pin per place; opening a place flies the camera in and its steps take
// over as individual pins, far enough apart at that distance to need no fan.
export interface Place {
  id: string;
  /** Only used when the place holds more than one stage; a lone stage speaks
      for itself. */
  label: string;
  stages: Stage[];
  x: number;
  y: number;
  zoom: { x: number; y: number; scale: number };
}

const byId = (id: StageId) => stages.find((stage) => stage.id === id)!;

// Half the vertical field of view (FOV 50) in radians, and the same
// `dist = 220 / scale` relation CameraRig uses, so a place's framing is
// expressed in the units the rig already speaks.
const HALF_FOV = Math.tan((25 * Math.PI) / 180);
const FRAME_MARGIN = 1.7; // room for the signs' own plates around the members

function place(id: string, label: string, ids: StageId[]): Place {
  const members = ids.map(byId);
  const x = members.reduce((sum, s) => sum + s.x, 0) / members.length;
  const y = members.reduce((sum, s) => sum + s.y, 0) / members.length;
  const reach = Math.max(...members.map((s) => Math.hypot(s.x - x, s.y - y)));
  const dist = members.length > 1 ? (reach / HALF_FOV) * FRAME_MARGIN : 220 / members[0].zoom.scale;
  return { id, label, stages: members, x, y, zoom: { x, y, scale: 220 / dist } };
}

export const places: Place[] = [
  place("portaria", "Portaria e pátio", ["agendamento", "checkin", "filas"]),
  place("balanca", "Balança", ["pesagem"]),
  place("tancagem", "Tancagem", ["estoque"]),
  place("doca", "Inspeção e doca", ["inspecao", "carga-descarga"]),
];

/** Stages that read across the whole operation instead of happening somewhere. */
export const layers: Stage[] = stages.filter((stage) => stage.layer);

export function placeOf(stage: Stage | null) {
  return stage ? places.find((p) => p.stages.includes(stage)) ?? null : null;
}

// Some legacy stage records were saved with UTF-8 decoded as Latin-1. Normalize
// those labels at the boundary so the interface always presents readable copy.
const mojibakeFixes: Record<string, string> = {
  "Ã§": "ç", "Ã£": "ã", "Ã¡": "á", "Ã©": "é", "Ã­": "í", "Ã³": "ó", "Ãº": "ú", "Ãµ": "õ", "Ã§Ã£": "çã", "Â·": "·", "Â": "",
};
function cleanCopy(value: string) {
  return Object.entries(mojibakeFixes).reduce((text, [bad, good]) => text.replaceAll(bad, good), value);
}
stages.forEach((stage) => {
  stage.title = cleanCopy(stage.title);
  stage.description = cleanCopy(stage.description);
});

/** The short name a stage goes by in the map marker and the station chips. */
export function stageLabel(stage: Stage) {
  return stage.short ?? stage.title.split(" - ")[0];
}

export const autoIntelligence = {
  title: "AutoIntelligence - Assistente de IA do Autoload",
  videoSrc: "/videos/autointelligence.mp4",
};

// Viewport over the real yard's operational cluster (world units ≈ meters),
// cropped from the full 850×950 terrain to the area that actually has activity.
export const VIEWBOX_X0 = -165;
export const VIEWBOX_Y0 = -115;
export const VIEWBOX_W = 375;
export const VIEWBOX_H = 300;
