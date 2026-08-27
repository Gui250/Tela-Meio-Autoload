"use client";

import { useEffect } from "react";
import { CloseIcon } from "./icons";
import { VideoPlayer } from "./VideoPlayer";

export function VideoOverlay({
  title,
  videoSrc,
  onClose,
}: {
  title: string;
  videoSrc: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="video-overlay-backdrop" onClick={onClose}>
      <div className="video-overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="video-overlay-header">
          <h3>{title}</h3>
          <button className="video-overlay-close" onClick={onClose} aria-label="Fechar vídeo">
            <CloseIcon />
          </button>
        </div>
        <VideoPlayer src={videoSrc} className="video-overlay-player" />
      </div>
    </div>
  );
}
