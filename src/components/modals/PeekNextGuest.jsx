import React from "react";
import GuestTile from "../GuestTile.jsx";

/**
 * Inline panel that lets the player preview the next rolodex guest and decide their fate.
 *
 * Triggered when the dog's 'reveal' ability is activated, entering the
 * 'dogReveal' phase. Returns null if no guest is provided. "Boot" removes the
 * guest from the rolodex permanently; "Keep" leaves them in place. Both actions
 * return to the 'party' phase.
 *
 * @param {object} props
 * @param {{ id: string, type: string, abilityUsed: boolean } | null} props.guest - The peeked guest to display, or null if none.
 * @param {function} props.onChoose - Called with 'boot' or 'keep' based on the player's choice.
 * @returns {React.ReactElement | null} The peek panel, or null when guest is falsy.
 */
export default function PeekNextGuest({ guest, onChoose }) {
  if (!guest) return null;
  return (
    <div className="dog-reveal window">
      <div
        className="window-body"
        style={{ display: "flex", gap: 8, alignItems: "center" }}
      >
        <span>👁️ Peek:</span>
        <GuestTile guest={guest} />
        <button type="button" className="btn" onClick={() => onChoose("boot")}>
          [←] Boot
        </button>
        <button type="button" className="btn" onClick={() => onChoose("keep")}>
          Keep [→]
        </button>
      </div>
    </div>
  );
}
