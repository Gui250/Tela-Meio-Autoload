import { StageId } from "@/config/stages";
import { BASE_ARRIVAL, CHAIN, Scenario, normalScenario } from "@/config/scenarios";

export type ImpactStatus = "ok" | "atencao" | "critico";

export interface StationImpact {
  stageId: StageId;
  /** Trucks per hour the station actually serves. */
  throughput: number;
  /** Load over capacity. At or above 1 the queue never clears. */
  utilization: number;
  /** Average wait before service. null = the queue does not stabilise. */
  waitMinutes: number | null;
  /** Average trucks waiting. null = grows without bound. */
  queue: number | null;
  status: ImpactStatus;
}

export interface ScenarioResult {
  impacts: Map<StageId, StationImpact>;
  /** Trucks the terminal clears in 24h. */
  perDay: number;
  /** Gate to gate, in minutes. null if any station is over capacity. */
  cycleMinutes: number | null;
  /** The station that constrains the scenario. */
  bottleneck: StationImpact | null;
}

// A station whose queue never clears has no finite average wait, so the model
// reports "does not stabilise" instead of a number. Below that, an M/M/1 queue
// is the standard result for random arrivals against one server, and it is
// what makes the scenarios comparable: every number in every scenario comes
// out of the same two inputs, arrival rate and capacity.
const SATURATED = 0.995;
const CRITICAL = 0.92;
const WARNING = 0.8;

export function simulate(scenario: Scenario): ScenarioResult {
  const impacts = new Map<StageId, StationImpact>();
  let arrival = BASE_ARRIVAL * scenario.arrivalFactor;
  let cycleMinutes: number | null = 0;
  let bottleneck: StationImpact | null = null;

  for (const station of CHAIN) {
    const capacity = station.capacity * (scenario.capacityFactors?.[station.stageId] ?? 1);
    // Rework means a share of trucks passes this station twice, so the station
    // carries more load than the terminal receives.
    const passes = scenario.rework?.stageId === station.stageId ? 1 + scenario.rework.share : 1;
    const load = arrival * passes;
    const utilization = load / capacity;
    const serviceMinutes = 60 / capacity;
    const stable = utilization < SATURATED;

    const impact: StationImpact = {
      stageId: station.stageId,
      throughput: Math.min(arrival, capacity / passes),
      utilization,
      waitMinutes: stable ? (utilization / (1 - utilization)) * serviceMinutes : null,
      queue: stable ? (utilization * utilization) / (1 - utilization) : null,
      status: !stable || utilization >= CRITICAL ? "critico" : utilization >= WARNING ? "atencao" : "ok",
    };
    impacts.set(station.stageId, impact);

    if (!bottleneck || impact.utilization > bottleneck.utilization) bottleneck = impact;
    cycleMinutes = cycleMinutes === null || impact.waitMinutes === null ? null : cycleMinutes + impact.waitMinutes + serviceMinutes;
    arrival = impact.throughput;
  }

  return { impacts, perDay: Math.round(arrival * 24), cycleMinutes, bottleneck };
}

/** The baseline every other scenario is read against. */
export const baseline = simulate(normalScenario);
