"use client";

import { useEffect, useRef } from "react";

import { tour } from "@/config/tour";
import { TourController } from "@/lib/use-tour";
import { CloseIcon, PauseIcon, PlayIcon, SkipIcon } from "./icons";

/**
 * The tour HUD, overlaid on the bottom of the map. The rail below the caption
 * is the yard's own route line: one dash per chapter, sized by how long that
 * chapter runs, filling as the truck moves through it.
 */
export function GuidedTour({ controller }: { controller: TourController }) {
  const { index, step, paused, railRef, goTo, next, previous, stop, togglePause } = controller;
  const hudRef = useRef<HTMLDivElement>(null);
  const running = index !== null;

  // The cinema beat's film stops where this HUD starts, and the HUD grows and
  // shrinks with the caption. Publishing its measured height means the footage
  // is never covered by the subtitle plate — and never gives up more room than
  // the plate actually needs. The 28px back is the top of the HUD's gradient,
  // which is transparent enough for the film to sit under.
  useEffect(() => {
    const hud = hudRef.current;
    if (!hud) return;
    const observer = new ResizeObserver(() =>
      document.documentElement.style.setProperty("--cinema-hud", `${hud.offsetHeight - 28}px`)
    );
    observer.observe(hud);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--cinema-hud");
    };
  }, [running]);

  if (index === null || !step) return null;

  return (
    <div className="tour-hud" ref={hudRef} aria-live="polite">
      <p className="tour-caption">{step.narration}</p>

      <div className="tour-controls">
        <span className="tour-chapter">
          <b>{String(index + 1).padStart(2, "0")}</b>
          {step.title}
        </span>
        <div className="tour-transport">
          <button type="button" onClick={previous} aria-label="Etapa anterior"><SkipIcon back /></button>
          <button type="button" onClick={togglePause} aria-label={paused ? "Retomar apresentação" : "Pausar apresentação"}>
            {paused ? <PlayIcon size={18} /> : <PauseIcon />}
          </button>
          <button type="button" onClick={next} aria-label="Próxima etapa"><SkipIcon /></button>
          <button type="button" className="tour-exit" onClick={stop} aria-label="Encerrar apresentação"><CloseIcon size={18} /></button>
        </div>
      </div>

      <div className="tour-rail" ref={railRef} data-paused={paused || undefined}>
        {tour.map((chapter, i) => (
          <button
            type="button"
            key={chapter.title}
            className="tour-rail-step"
            style={{ flexGrow: chapter.seconds }}
            data-state={i < index ? "done" : i === index ? "current" : "ahead"}
            onClick={() => goTo(i)}
            aria-label={`Ir para ${chapter.title}`}
            aria-current={i === index || undefined}
          >
            <span className="tour-rail-fill" />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Panel content for the chapters that have no video of their own. */
export function TourTitleCard({ index, title, minutes }: { index: number; title: string; minutes: number }) {
  return (
    <div className="tour-card">
      <span className="stage-panel-kicker">Apresentação guiada</span>
      <p className="tour-card-index">{String(index + 1).padStart(2, "0")}</p>
      <h3 className="tour-card-title">{title}</h3>
      <p className="tour-card-meta">{tour.length} etapas · cerca de {minutes} min</p>
    </div>
  );
}
