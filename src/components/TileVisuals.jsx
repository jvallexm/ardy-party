import React from "react";
import { formatBonus } from "../lib/display.js";

/**
 * Renders the inner visual content of a guest tile: ability icon, pop badge, cash badge, and emoji.
 *
 * The pop badge is suppressed for dancers because their popularity contribution
 * is count² at scoring time — a per-tile number would be misleading.
 * Cash badges always render when non-zero regardless of guest type.
 *
 * @param {object} props
 * @param {string} props.guestType - Guest type key (e.g. 'dancer', 'richPal') used to detect special cases.
 * @param {{ emoji: string, popBonus: number, cashBonus: number, abilityIcon: string | null }} props.def - Static guest type definition from GUEST_TYPES.
 * @param {boolean} props.showAbility - When true, renders the ability icon if one is defined.
 * @returns {React.ReactElement} A fragment of badge and emoji spans.
 */
export default function TileVisuals({ guestType, def, showAbility }) {
  const isDancer = guestType === "dancer";
  return (
    <>
      {showAbility && def.abilityIcon && (
        <span className="tile-ability-icon">{def.abilityIcon}</span>
      )}
      {!isDancer && def.popBonus !== 0 && (
        <span className="tile-pop">{formatBonus(def.popBonus)}</span>
      )}
      {def.cashBonus !== 0 && (
        <span className="tile-cash">{formatBonus(def.cashBonus)}</span>
      )}
      <span className="tile-emoji">{def.emoji}</span>
      {def.hasStar && <span className="tile-star">⭐</span>}
    </>
  );
}
