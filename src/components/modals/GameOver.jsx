import React from "react";

export default function GameOver({ state }) {
  return (
    <div className="window">
      <div className="title-bar">
        <span>Game Over</span>
      </div>
      <div
        className="window-body"
        style={{ textAlign: "center", padding: "2rem" }}
      >
        <p>24 nights complete.</p>
        <p>
          Final pop: {state.popularity} | Cash: {state.cash}
        </p>
      </div>
    </div>
  );
}
