"use client";

import { useEffect, useRef, useState } from "react";
import { Scenario, scenarios } from "@/config/scenarios";

export function ScenarioPicker({
  scenario,
  onSelect,
}: {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="scenario-picker" ref={rootRef}>
      <button
        className="scenario-trigger"
        data-simulating={scenario.id !== "normal" || undefined}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="scenario-trigger-kicker">Cenário</span>
        {scenario.title}
      </button>

      {open && (
        <ul className="scenario-list" role="listbox" aria-label="Cenários de simulação">
          {scenarios.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={option.id === scenario.id}
                className={`scenario-option${option.id === scenario.id ? " is-active" : ""}`}
                onClick={() => {
                  onSelect(option);
                  setOpen(false);
                }}
              >
                <span className="scenario-option-title">{option.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
