import React from "react";
import GuestTile from "./GuestTile.jsx";

/**
 * Renders a flat grid of guest tiles from an array of guest objects.
 *
 * Used in the house, rolodex modal, and blame picker. Keyboard focus is
 * tracked externally via focusedIndex; click handling is optional so the
 * rolodex read-only view can omit it.
 *
 * @param {object} props
 * @param {Array} props.guests - Array of guest objects to render.
 * @param {number} [props.focusedIndex=-1] - Index of the guest tile to render as keyboard-focused.
 * @param {function} [props.onGuestClick] - Called with a guest object when its tile is clicked; omit for read-only display.
 * @returns {React.ReactElement} A div containing one GuestTile per guest.
 */
export default function GuestGrid({
  guests,
  focusedIndex = -1,
  onGuestClick,
  inactive = false,
}) {
  return (
    <div className="house-grid">
      {guests.map((g, i) => (
        <GuestTile
          key={g.id}
          guest={g}
          onClick={onGuestClick}
          focused={focusedIndex === i}
          inactive={inactive}
        />
      ))}
    </div>
  );
}
