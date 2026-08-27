"use client";

import { useState } from "react";
import { Stage, stageLabel, stages } from "@/config/stages";
import { Scenario } from "@/config/scenarios";
import { tourMinutes } from "@/config/tour";
import { ScenarioResult } from "@/lib/scenario-model";
import { ScenarioSummary } from "./ScenarioPanel";
import { TourController } from "@/lib/use-tour";
import { TourTitleCard } from "./GuidedTour";
import { VideoPlayer } from "./VideoPlayer";

type Tab = "descricao" | "video";

function StageEmptyState({ onSelectStage }: { onSelectStage: (stage: Stage) => void }) {
  return (
    <div className="stage-panel-empty">
      <span className="stage-panel-kicker">Etapa da operação</span>
      <p className="stage-panel-empty-hint">Arraste a planta para explorar. Toque em um ponto do pátio ou escolha uma etapa abaixo.</p>
      <div className="station-grid">
        {stages.filter((s) => !s.layer).map((s) => (
          <button type="button" key={s.id} className="station-chip" onClick={() => onSelectStage(s)}>
            <span className="station-chip-dot" />
            {stageLabel(s)}
          </button>
        ))}
      </div>
    </div>
  );
}

function StageContent({ stage }: { stage: Stage }) {
  // The tour plays each clip full screen over the whole totem (see TourStage
  // in PlantMap), synced to the camera flight and the narration. So the panel
  // never opens on the video tab and never autoplays: the takeover owns
  // playback, the panel keeps the description a visitor can read once the
  // presentation hands the screen back.
  const [tab, setTab] = useState<Tab>("descricao");
  const [videoPlaying, setVideoPlaying] = useState(false);
  const hideChrome = tab === "video" && videoPlaying;

  const activateTabOnTouch = (event: React.PointerEvent<HTMLButtonElement>, nextTab: Tab) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      event.preventDefault();
      event.stopPropagation();
      setTab(nextTab);
    }
  };

  return (
    <>
      {!hideChrome && (
        <div className="stage-panel-header">
          <div>
            <span className="stage-panel-kicker">{stage.layer ? "Em toda a operação" : "Etapa da operação"}</span>
            <h3>{stage.title}</h3>
          </div>
        </div>
      )}
      {!hideChrome && (
        <div className="stage-panel-tabs" data-active={tab} role="tablist" aria-label="Conteúdo da etapa">
          <button type="button" role="tab" aria-selected={tab === "descricao"} className={tab === "descricao" ? "is-active" : ""} onPointerDown={(event) => activateTabOnTouch(event, "descricao")} onClick={() => setTab("descricao")}>Descrição</button>
          <button type="button" role="tab" aria-selected={tab === "video"} className={tab === "video" ? "is-active" : ""} onPointerDown={(event) => activateTabOnTouch(event, "video")} onClick={() => setTab("video")}>Vídeo</button>
        </div>
      )}
      <div className="stage-panel-body" role="tabpanel" data-tab={tab}>
        {tab === "descricao" ? (
          <div className="stage-panel-description-wrap"><p className="stage-panel-description">{stage.description}</p><button type="button" className="stage-watch-video-btn" onClick={() => setTab("video")}>Assistir vídeo da etapa</button></div>
        ) : (
          <VideoPlayer src={stage.videoSrc} className="stage-panel-video" onPlayingChange={setVideoPlaying} />
        )}
      </div>
    </>
  );
}

export function StagePanel({
  stage,
  onSelectStage,
  tour,
  scenario,
  result,
}: {
  stage: Stage | null;
  onSelectStage: (stage: Stage) => void;
  tour: TourController;
  scenario: Scenario;
  result: ScenarioResult;
}) {
  return (
    <div className="stage-panel-screen">
      {stage ? (
        <StageContent key={`${stage.id}-${tour.running}`} stage={stage} />
      ) : tour.running && tour.step && tour.index !== null ? (
        <TourTitleCard index={tour.index} title={tour.step.title} minutes={tourMinutes} />
      ) : scenario.id !== "normal" ? (
        <ScenarioSummary scenario={scenario} result={result} onSelectStage={onSelectStage} />
      ) : (
        <StageEmptyState onSelectStage={onSelectStage} />
      )}
    </div>
  );
}
