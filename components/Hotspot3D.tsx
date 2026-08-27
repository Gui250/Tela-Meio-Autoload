"use client";

import { Html } from "@react-three/drei";
import { ImpactStatus } from "@/lib/scenario-model";

/**
 * A yard sign: a plate naming what is at this spot, standing on a short post
 * over a ring drawn on the ground point itself.
 *
 * The plate is DOM, projected onto a 3D position by drei's <Html>, so it is
 * sized in CSS pixels while its anchor comes from the camera. Everything that
 * lifts it off the ground is therefore in pixels too — a world-unit post can't
 * stay in step with a plate whose type scales per breakpoint, and that mismatch
 * is what used to pile the gatehouse signs on top of each other.
 */
export function YardPin({
  x,
  y,
  name,
  note,
  onClick,
  dimmed,
  muted,
  active,
  impact,
}: {
  x: number;
  y: number;
  name: string;
  /** Set only when the pin stands for a place holding several steps. */
  note?: string;
  onClick: () => void;
  /** A sign the camera is not on, but still inside the place being read. */
  dimmed: boolean;
  /** A place elsewhere in the yard while another one is open: it keeps its
      ground ring as context and as the way back, and drops its plate. */
  muted?: boolean;
  active: boolean;
  /** How the running scenario hits this spot. Undefined while none is running. */
  impact?: ImpactStatus;
}) {
  // The sign is DOM, but it lives *inside* the canvas's own container — the
  // element r3f listens on. So a click that lands on a plate keeps bubbling
  // past it, r3f raycasts the point under it, hits the ground and clears the
  // selection: the step you just picked bounced straight back to the overview.
  // Stopping it here also keeps OrbitControls from reading the tap as a drag.
  const activate = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    onClick();
  };

  // drei's <Html> sits inside OrbitControls' gesture handling, which swallows
  // the click on touch. Fire on pointerdown for touch/pen and let mouse keep
  // the real click.
  const activateOnTouch = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      event.preventDefault();
      activate(event);
    }
  };

  return (
    <group position={[x, 0, y]}>
      {/* drei stacks these wrappers by distance to the camera, so without a
          band of its own a ring on the far side of the yard can be dealt a
          higher z-index than the sign you are reading. Named signs get their
          own band above every muted ring. */}
      <Html
        position={[0, 0, 0]}
        center
        className="yard-pin-anchor"
        zIndexRange={muted ? [12, 2] : [40, 20]}
      >
        <button
          type="button"
          className="yard-pin"
          data-active={active || undefined}
          data-dimmed={dimmed || undefined}
          data-muted={muted || undefined}
          data-impact={impact}
          onPointerDown={activateOnTouch}
          onClick={activate}
          aria-label={note ? `${name} — ${note}` : name}
        >
          <span className="yard-pin-plate">
            <span className="yard-pin-name">{name}</span>
            {note && <span className="yard-pin-note">{note}</span>}
          </span>
        </button>
      </Html>
    </group>
  );
}
