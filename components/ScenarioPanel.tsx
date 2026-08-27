"use client";

import { Scenario } from "@/config/scenarios";
import { Stage, stageLabel, stages } from "@/config/stages";
import { baseline, ScenarioResult } from "@/lib/scenario-model";

const stageById = new Map(stages.map((stage) => [stage.id, stage]));


function minutes(value: number | null) {
  return value === null ? "Não estabiliza" : `${Math.round(value)} min`;
}

/** Change against the normal-operation run, which is what makes them comparable. */
function delta(value: number | null, reference: number | null) {
  if (value === null || reference === null || reference === 0) return null;
  const change = Math.round(((value - reference) / reference) * 100);
  if (change === 0) return "igual à normal";
  return `${change > 0 ? "+" : "−"}${Math.abs(change)}% vs. normal`;
}

function Metric({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <div className="scenario-metric">
      <span className="scenario-metric-label">{label}</span>
      <strong className="scenario-metric-value">{value}</strong>
      {note && <span className="scenario-metric-note">{note}</span>}
    </div>
  );
}

/** Panel content while a scenario is running and no single stage is selected. */
export function ScenarioSummary({
  scenario,
  result,
  onSelectStage,
}: {
  scenario: Scenario;
  result: ScenarioResult;
  onSelectStage: (stage: Stage) => void;
}) {
  const affected = [...result.impacts.values()].filter((impact) => impact.status !== "ok");

  return (
    <div className="scenario-summary">
      <span className="stage-panel-kicker">Cenário simulado</span>
      <h3 className="scenario-summary-title">{scenario.title}</h3>
      <p className="scenario-summary-what">{scenario.summary}</p>
      <p className="scenario-summary-insight">{scenario.insight}</p>

      <div className="scenario-metrics">
        <Metric
          label="Caminhões por dia"
          value={String(result.perDay)}
          note={delta(result.perDay, baseline.perDay)}
        />
        <Metric
          label="Tempo de ciclo"
          value={minutes(result.cycleMinutes)}
          note={delta(result.cycleMinutes, baseline.cycleMinutes)}
        />
        <Metric
          label="Gargalo"
          value={result.bottleneck ? stageLabel(stageById.get(result.bottleneck.stageId)!) : "—"}
          note={result.bottleneck ? `${Math.round(result.bottleneck.utilization * 100)}% de ocupação` : null}
        />
      </div>

      <span className="scenario-affected-label">
        {affected.length ? `${affected.length} etapa${affected.length > 1 ? "s" : ""} afetada${affected.length > 1 ? "s" : ""}` : "Nenhuma etapa afetada"}
      </span>
      <div className="station-grid">
        {affected.map((impact) => {
          const stage = stageById.get(impact.stageId)!;
          return (
            <button type="button" key={impact.stageId} className="station-chip" onClick={() => onSelectStage(stage)}>
              <span className="station-chip-dot" data-impact={impact.status} />
              <span className="scenario-chip-text">
                {stageLabel(stage)}
                <em>{impact.waitMinutes === null ? "Fila não estabiliza" : `${Math.round(impact.waitMinutes)} min de espera`}</em>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
