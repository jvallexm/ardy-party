import React, { useState, useEffect } from "react";

export default function ModeSelect({ onSelect }) {
  const [scenario, setScenario] = useState(null);

  function pickMode(mode) {
    if (!scenario) return;
    onSelect({ scenario, mode });
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "1") setScenario("s1");
      else if (e.key === "2") setScenario("s2");
      else if (e.key === "c" || e.key === "C") pickMode("classic");
      else if (e.key === "t" || e.key === "T") pickMode("test");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [scenario, onSelect]);

  return (
    <div className="window mode-select">
      <div className="title-bar">
        <span>Ardy Party</span>
      </div>
      <div className="window-body mode-select-body">
        <p>Choose your scenario:</p>
        <div className="mode-select-buttons">
          <button
            type="button"
            className={`btn${scenario === "s1" ? " active" : ""}`}
            onClick={() => setScenario("s1")}
          >
            Scenario 1
          </button>
          <button
            type="button"
            className={`btn${scenario === "s2" ? " active" : ""}`}
            onClick={() => setScenario("s2")}
          >
            Scenario 2
          </button>
        </div>
        <p>Choose your mode:</p>
        <div className="mode-select-buttons">
          <button
            type="button"
            className="btn"
            disabled={!scenario}
            onClick={() => pickMode("classic")}
          >
            Classic
          </button>
          <button
            type="button"
            className="btn"
            disabled={!scenario}
            onClick={() => pickMode("test")}
          >
            Test Mode
          </button>
        </div>
      </div>
    </div>
  );
}
