import React from "react";
import GuestGrid from "./GuestGrid.jsx";
import { BLAME_REASONS } from "../lib/blameReasons.js";

/**
 * Modal overlay that prompts the player to select a guest to eject.
 *
 * Shown when the game enters the 'blame' phase due to too much trouble or
 * overcapacity. Displays a context-specific message from BLAME_REASONS and
 * renders all house guests as a selectable grid.
 *
 * @param {object} props
 * @param {Array} props.house - Current house guest array; all guests are selectable targets.
 * @param {function} props.onBlame - Called with the selected guest's ID.
 * @param {string} props.context - Blame context key (e.g. 'trouble', 'overcapacity') used to look up the display message.
 * @param {number} [props.focusedIndex=-1] - Index into the house array to highlight for keyboard nav.
 * @returns {React.ReactElement} The blame picker modal.
 */
export default function BlamePicker({
  house,
  onBlame,
  context,
  focusedIndex = -1,
}) {
  const reason = BLAME_REASONS[context];
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="title-bar">
          <span>Who's to blame?</span>
        </div>
        <div className="window-body">
          <p>{reason}</p>
          <GuestGrid
            guests={house}
            focusedIndex={focusedIndex}
            onGuestClick={(g) => onBlame(g.id)}
          />
        </div>
      </div>
    </div>
  );
}
