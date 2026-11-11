import React from "react";
import { countStars } from "../lib/gameState.js";

/**
 * Heads-up display showing live game stats and the End Party action.
 *
 * Displays current popularity, cash, trouble counter (up to 3 ❌ icons), and
 * star count (up to 4 ⭐ icons based on star guests in the house). The End
 * Party button can receive keyboard focus independently of the tile grid.
 *
 * @param {object} props
 * @param {object} props.state - Current game state.
 * @param {function} props.onEndParty - Called when the End Party button is activated.
 * @param {boolean} [props.endPartyFocused=false] - When true, renders the button with the focused style for keyboard nav.
 * @returns {React.ReactElement} The HUD bar.
 */
export default function HUD({ state, onEndParty, endPartyFocused = false }) {
  const stars = countStars(state.house);
  return (
    <div className="window">
      <div className="title-bar hud-bar">
        <span className="hud-item">Pop: {state.popularity}/60</span>
        <span className="hud-item">Cash: {state.cash}/30</span>
        <span className="hud-item trouble-display">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`trouble-x${i < state.trouble ? "" : " off"}`}
            >
              ❌
            </span>
          ))}
        </span>
        <span className="hud-item">Nights: {state.nightsLeft}</span>
        <span className="stars">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`star${i < stars ? "" : " off"}`}>
              ⭐
            </span>
          ))}
        </span>
        <button
          type="button"
          className={`btn hud-btn${endPartyFocused ? " focused" : ""}`}
          onClick={onEndParty}
        >
          End Party
        </button>
      </div>
    </div>
  );
}
