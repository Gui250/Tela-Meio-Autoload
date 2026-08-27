import { StageId } from "./stages";

export interface Scenario {
  id: string;
  /** Short name for the picker and the toolbar chip. */
  title: string;
  /** What changed in the operation. */
  summary: string;
  /** What the simulation is meant to teach — the reason to run this one. */
  insight: string;
  /** Multiplies the baseline truck arrival rate at the gate. */
  arrivalFactor: number;
  /** Per-station capacity multipliers. Anything omitted keeps nominal capacity. */
  capacityFactors?: Partial<Record<StageId, number>>;
  /** Share of trucks sent back through a station for a second pass. */
  rework?: { stageId: StageId; share: number };
}

// Trucks per hour arriving at the gate on a nominal day, and what each station
// can serve per hour with nominal staffing. Both come from the yard the layout
// was drawn from; change them here and every scenario re-derives together.
export const BASE_ARRIVAL = 18;

/** The stations a truck passes through, in the order it passes through them. */
export const CHAIN: { stageId: StageId; capacity: number }[] = [
  { stageId: "agendamento", capacity: 60 },
  { stageId: "checkin", capacity: 30 },
  { stageId: "filas", capacity: 40 },
  { stageId: "pesagem", capacity: 28 },
  { stageId: "inspecao", capacity: 26 },
  { stageId: "carga-descarga", capacity: 24 },
  { stageId: "estoque", capacity: 60 },
];

export const scenarios: Scenario[] = [
  {
    id: "normal",
    title: "Operação normal",
    summary: `${BASE_ARRIVAL} caminhões por hora, todas as estações em capacidade nominal.`,
    insight: "A linha de base. Toda estação opera abaixo de 80% de ocupação, então as filas se dissolvem sozinhas entre as chegadas.",
    arrivalFactor: 1,
  },
  {
    id: "pico",
    title: "Fluxo +30%",
    summary: "Trinta por cento mais caminhões chegando, mesma estrutura para atender.",
    insight: "A capacidade não some — só deixa de sobrar. A carga e descarga passa de 75% para quase 98% de ocupação, e é aí que a fila deixa de escoar.",
    arrivalFactor: 1.3,
  },
  {
    id: "balanca",
    title: "Falha em uma balança",
    summary: "Uma das duas balanças fora de operação; a pesagem atende com pouco mais da metade do ritmo.",
    insight: "A pesagem passa a atender menos caminhões do que chegam. A fila não estabiliza e o terminal inteiro passa a produzir no ritmo da balança que restou.",
    arrivalFactor: 1,
    capacityFactors: { pesagem: 0.55 },
  },
  {
    id: "tanque",
    title: "Tanque indisponível",
    summary: "Um tanque bloqueado tira parte das posições de carga e descarga.",
    insight: "O terminal continua atendendo todos os caminhões do dia — mas cada um espera muito mais na doca. Perda de tempo, não de volume.",
    arrivalFactor: 1,
    capacityFactors: { "carga-descarga": 0.8 },
  },
  {
    id: "inspecao",
    title: "Inspeção reprovada",
    summary: "Cerca de um em cada seis caminhões volta para uma segunda inspeção.",
    insight: "O retrabalho fica contido na inspeção e não derruba o terminal — mas consome a folga que absorveria qualquer outro imprevisto no mesmo dia.",
    arrivalFactor: 1,
    rework: { stageId: "inspecao", share: 0.18 },
  },
  {
    id: "portaria",
    title: "Congestionamento na portaria",
    summary: "Validação lenta na entrada derruba o ritmo de liberação do check-in.",
    insight: "Nenhum caminhão é perdido e nenhuma etapa seguinte fica sobrecarregada — a portaria simplesmente atrasa o dia inteiro antes que ele comece.",
    arrivalFactor: 1,
    capacityFactors: { checkin: 0.63 },
  },
];

export const normalScenario = scenarios[0];
