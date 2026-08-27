"use client";

import { useState } from "react";
import { autoIntelligence } from "@/config/stages";
import { BotIcon } from "./icons";
import { VideoOverlay } from "./VideoOverlay";

export function AutoIntelligenceFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="ai-fab"
        onClick={() => setOpen(true)}
        aria-label={autoIntelligence.title}
        title={autoIntelligence.title}
      >
        <BotIcon />
      </button>

      {open && (
        <VideoOverlay
          title={autoIntelligence.title}
          videoSrc={autoIntelligence.videoSrc}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
