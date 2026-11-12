import React from "react";

/**
 * Victory screen shown when the player gets 4 star guests in the house simultaneously.
 *
 * @param {object} props
 * @param {object} props.state - Final game state.
 * @returns {React.ReactElement} The win screen window.
 */
export default function WinScreen({ state }) {
  return (
    <div className="window">
      <div className="title-bar">
        <span>🎉 You Win! 🎉</span>
      </div>
      <div
        className="window-body"
        style={{ textAlign: "center", padding: "2rem" }}
      >
        <p>⭐⭐⭐⭐</p>
        <p>4-star party achieved!</p>
        <p>Night {24 - state.nightsLeft} of 24</p>
        <p>
          Final pop: {state.popularity} | Cash: {state.cash}
        </p>
      </div>
    </div>
  );
}
