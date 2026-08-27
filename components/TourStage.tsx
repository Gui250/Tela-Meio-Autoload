"use client";

import { Stage } from "@/config/stages";

/**
 * The presentation's cinema beat.
 *
 * Once the camera has finished flying to a stage, that stage's clip takes the
 * whole screen — not a panel, not a monitor floating over the yard. The demo
 * is watched from three metres away at a trade show, and at that distance a
 * boxed player inside half a split screen is unreadable; the totem has to
 * become the film.
 *
 * The clip carries no title of its own: the tour HUD underneath already names
 * the chapter and shows its caption. A caption plate over the footage would
 * be the third copy of the same fact — and it would sit on the bottom strip
 * of the recording, which is where the Autoload action bar lives. The film
 * stops above the HUD instead; see --cinema-hud in globals.css.
 *
 * Always muted — the totem has no audio.
 */
export function TourStage({ stage }: { stage: Stage }) {
  return (
    <div className="tour-stage" aria-hidden="true">
      <video
        key={stage.videoSrc}
        className="tour-stage-video"
        src={stage.videoSrc}
        autoPlay
        preload="auto"
        muted
        loop
        playsInline
      />
    </div>
  );
}
