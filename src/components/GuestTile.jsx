import React from "react";
import { GUEST_TYPES } from "../lib/guests.js";
import TileVisuals from "./TileVisuals.jsx";

/**
 * Renders a single guest as a clickable tile button.
 *
 * The ability icon is shown for trouble guests (as a non-usable ❌ warning),
 * for guests with an unused active ability, and always for dancers (whose ♪
 * icon is decorative). The icon is hidden once the ability has been used or
 * if the ability is passive (fullHouseBonus).
 *
 * @param {object} props
 * @param {{ id: string, type: string, abilityUsed: boolean }} props.guest - The guest instance to render.
 * @param {function} [props.onClick] - Called with the guest object when the tile is clicked.
 * @param {boolean} [props.disabled] - When true, renders the button as disabled.
 * @param {string} [props.title] - Tooltip text for the tile button.
 * @param {boolean} [props.focused] - When true, applies the focused CSS class for keyboard nav.
 * @returns {React.ReactElement} A button tile representing the guest.
 */
export default function GuestTile({
  guest,
  onClick,
  disabled,
  title,
  focused,
  inactive = false,
}) {
  const def = GUEST_TYPES[guest.type];
  const popBonusOverride =
    guest.type === "climber" && guest.climberCount > 0
      ? guest.climberCount
      : undefined;
  const isDancer = guest.type === "dancer";
  const showAbility =
    (def.trouble && def.abilityIcon) ||
    (def.abilityIcon &&
      def.ability !== "fullHouseBonus" &&
      def.ability !== "removeTrouble" &&
      !guest.abilityUsed) ||
    isDancer ||
    def.ability === "removeTrouble";

  return (
    <button
      type="button"
      className={`tile${focused ? " focused" : ""}${inactive ? " inactive" : ""}`}
      onClick={onClick ? () => onClick(guest) : undefined}
      disabled={disabled || inactive}
      title={title}
    >
      <TileVisuals
        guestType={guest.type}
        def={def}
        showAbility={showAbility}
        popBonusOverride={popBonusOverride}
      />
    </button>
  );
}
