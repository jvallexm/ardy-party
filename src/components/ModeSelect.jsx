import React from "react";

/**
 * Pre-game mode selection screen presented before the first party.
 *
 * @param {object} props
 * @param {function} props.onSelect - Called with 'classic' or 'test' when a mode is chosen.
 * @returns {React.ReactElement} The mode picker window.
 */
export default function ModeSelect({ onSelect }) {
  return (
    <div className="window mode-select">
      <div className="title-bar">
        <span>Ardy Party</span>
      </div>
      <div className="window-body mode-select-body">
        <p>Choose your game mode:</p>
        <div className="mode-select-buttons">
          <button
            type="button"
            className="btn"
            onClick={() => onSelect("classic")}
          >
            Classic
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onSelect("test")}
          >
            Test Mode
          </button>
        </div>
      </div>
    </div>
  );
}
