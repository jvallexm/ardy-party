import React, { useState } from "react";
import App from "./App.jsx";
import ModeSelect from "./components/modals/ModeSelect.jsx";
import { createInitialState } from "./lib/gameState.js";

/**
 * Top-level wrapper that presents the mode selection screen before starting the game.
 *
 * Renders ModeSelect until the player picks a mode, then creates initial state
 * for that mode and hands off to App.
 *
 * @returns {React.ReactElement} Either the mode picker or the active game.
 */
export default function GameContainer() {
  const [gameState, setGameState] = useState(null);

  const handleSelectMode = (mode) => {
    setGameState(createInitialState({ mode }));
  };

  if (!gameState) return <ModeSelect onSelect={handleSelectMode} />;
  return <App initialState={gameState} />;
}
