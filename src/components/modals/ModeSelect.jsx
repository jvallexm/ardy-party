import React, { useEffect } from "react";

/**
 * Pre-game mode selection screen presented before the first party.
 *
 * Pressing C selects Classic; pressing T selects Test Mode.
 *
 * @param {object} props
 * @param {function} props.onSelect - Called with 'classic' or 'test' when a mode is chosen.
 * @returns {React.ReactElement} The mode picker window.
 */
export default function ModeSelect({ onSelect }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "c" || e.key === "C") onSelect("classic");
      if (e.key === "t" || e.key === "T") onSelect("test");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onSelect]);

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
