"use client";

import { useCallback, useMemo, useState } from "react";
import { Stage } from "@/config/stages";
import { Scenario, normalScenario } from "@/config/scenarios";
import { simulate } from "@/lib/scenario-model";
import { useTour } from "@/lib/use-tour";
import { PlantMap } from "./PlantMap";
import { StagePanel } from "./StagePanel";

export function StageView() {
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  // Nothing sets this any more: the toolbar picker was the only entry point.
  const [scenario] = useState<Scenario>(normalScenario);
  const tour = useTour(setActiveStage);
  const result = useMemo(() => simulate(scenario), [scenario]);

  // A tap on a hotspot, a station chip or the ground means someone took the
  // wheel — end the presentation rather than fight its timer for the camera.
  const { running, stop } = tour;
  const selectStage = useCallback(
    (stage: Stage | null) => {
      if (running) stop();
      setActiveStage(stage);
    },
    [running, stop]
  );

  return (
    <div className="stage-view" data-tour={running || undefined}>
      <PlantMap
        activeStage={activeStage}
        onSelectStage={selectStage}
        tour={tour}
        scenario={scenario}
        result={result}
      />
      <StagePanel stage={activeStage} onSelectStage={selectStage} tour={tour} scenario={scenario} result={result} />
    </div>
  );
}
