import React, { useState, useEffect } from "react";
import usePhaseReset from "./hooks/usePhaseReset.js";
import useKeyboardNav from "./hooks/useKeyboardNav.js";
import HUD from "./components/HUD.jsx";
import House from "./components/House.jsx";
import RolodexModal from "./components/RolodexModal.jsx";
import SummaryModal from "./components/SummaryModal.jsx";
import Shop from "./components/Shop.jsx";
import BlamePicker from "./components/BlamePicker.jsx";
import PeekNextGuest from "./components/PeekNextGuest.jsx";
import WinScreen from "./components/WinScreen.jsx";
import { GUEST_TYPES, SHOP_GUESTS } from "./lib/guests.js";
import {
  createInitialState,
  addGuestToParty,
  endParty,
  confirmSummary,
  blameGuest,
  activateAbility,
  kickGuest,
  confirmDogReveal,
  purchaseGuest,
  expandHouse,
  startNextParty,
  driverPickGuest,
} from "./lib/gameState.js";

const COLS = 9;

/**
 * Root component that owns all game state and orchestrates phase transitions.
 *
 * Renders the correct UI for each phase (party, blame, shop, summary, dogReveal)
 * and wires together all action handlers. Accepts optional injection props so
 * tests can start from a specific scenario without going through the full game flow.
 *
 * @param {object} [props] - Optional injection props for testing.
 * @param {object} [props.initialState] - Overrides the default initial game state.
 * @param {{ row: number, col: number }} [props.initialCursor] - Overrides the default starting cursor position.
 * @returns {React.ReactElement} The active game UI for the current phase.
 */
export default function App({ initialState, initialCursor } = {}) {
  const [state, setState] = useState(
    () => initialState || createInitialState(),
  );
  const [rolodexOpen, setRolodexOpen] = useState(false);
  const [rolodexCursor, setRolodexCursor] = useState(0);
  const [cursor, setCursor] = useState(
    () => initialCursor || { row: 0, col: 1 },
  );
  const [blameCursor, setBlameCursor] = useState(0);
  const [shopCursor, setShopCursor] = useState(0);

  usePhaseReset(state.phase, [
    [setCursor, { row: 0, col: 1 }],
    [setBlameCursor, 0],
    [setShopCursor, 0],
  ]);

  const handleDoor = () => {
    const nextGuest = state.rolodex.find(
      (g) => !state.bannedThisParty.includes(g.id),
    );
    setState(addGuestToParty(state, nextGuest.id));
  };

  const handleGuestClick = (guest) => {
    if (state.kickMode) {
      setState(kickGuest(state, state.kickMode.kickerId, guest.id));
      return;
    }
    const def = GUEST_TYPES[guest.type];
    if (def.ability && !guest.abilityUsed) {
      setState(activateAbility(state, guest.id));
    }
  };

  useEffect(() => {
    if (state.driverMode) setRolodexOpen(true);
  }, [state.driverMode]);

  useEffect(() => {
    if (rolodexOpen) setRolodexCursor(0);
  }, [rolodexOpen]);

  const handleEndParty = () => setState(endParty(state));
  const handleConfirmSummary = () => setState(confirmSummary(state));
  const handleBlame = (id) => setState(blameGuest(state, id));
  const handleDog = (choice) => setState(confirmDogReveal(state, choice));
  const handleBuy = (type) => setState(purchaseGuest(state, type));
  const handleExpand = () => setState(expandHouse(state));
  const handleNext = () => setState(startNextParty(state));
  const handleDriverPick = (guest) => {
    setState(driverPickGuest(state, guest.id));
    setRolodexOpen(false);
  };
  const handleRolodexClose = () => {
    if (state.driverMode) setState((s) => ({ ...s, driverMode: null }));
    setRolodexOpen(false);
  };

  const rolodexModalGuests = [...(state.driverMode
    ? state.rolodex.filter((g) => !state.bannedThisParty.includes(g.id))
    : state.rolodex
  )].sort((a, b) => a.order - b.order);

  useKeyboardNav({
    state,
    setState,
    cursor,
    setCursor,
    blameCursor,
    setBlameCursor,
    shopCursor,
    setShopCursor,
    rolodexOpen,
    setRolodexOpen,
    rolodexCursor,
    setRolodexCursor,
    rolodexGuests: rolodexModalGuests,
    handleRolodexPick: state.driverMode ? handleDriverPick : undefined,
    handleOpenRolodex: () => setRolodexOpen(true),
    handleConfirmSummary,
    handleBlame,
    handleBuy,
    handleExpand,
    handleNext,
    handleEndParty,
    handleDoor,
    handleGuestClick,
  });

  if (state.phase === "won") {
    return <WinScreen state={state} />;
  }

  if (state.phase === "blame") {
    return (
      <BlamePicker
        house={state.house}
        onBlame={handleBlame}
        context={state.blameContext}
        focusedIndex={blameCursor}
      />
    );
  }

  const shopGuests = state.testShop ?? SHOP_GUESTS;

  if (state.phase === "shop") {
    return (
      <>
        <Shop
          state={state}
          onBuy={handleBuy}
          onExpand={handleExpand}
          onNext={handleNext}
          onOpenRolodex={() => setRolodexOpen(true)}
          focusedIndex={shopCursor}
          shopGuests={shopGuests}
        />
        <RolodexModal
          open={rolodexOpen}
          rolodex={state.rolodex}
          onClose={() => setRolodexOpen(false)}
          focusedIndex={rolodexCursor}
        />
      </>
    );
  }

  const revealedGuest =
    state.phase === "dogReveal"
      ? state.rolodex.find((g) => g.id === state.dogRevealGuestId)
      : null;

  const focusedTileIndex = cursor.row < 0 ? -1 : cursor.row * COLS + cursor.col;

  return (
    <div className="window">
      <div className="title-bar">
        <span>Ardy Party</span>
      </div>
      <div className="window-body">
        <HUD
          state={state}
          onEndParty={handleEndParty}
          endPartyFocused={cursor.row === -1}
        />
        <House
          state={state}
          onOpenRolodex={() => setRolodexOpen(true)}
          onDoor={handleDoor}
          onGuestClick={handleGuestClick}
          focusedTileIndex={focusedTileIndex}
        />
        {state.kickMode && <p>Click a guest to kick them out.</p>}
        {state.driverMode && !rolodexOpen && (
          <p>Driver: open your rolodex to pick any guest to invite.</p>
        )}
        <RolodexModal
          open={rolodexOpen}
          rolodex={
            state.driverMode
              ? state.rolodex.filter(
                  (g) => !state.bannedThisParty.includes(g.id),
                )
              : state.rolodex
          }
          houseGuests={state.driverMode ? [] : state.house}
          onClose={handleRolodexClose}
          onGuestPick={state.driverMode ? handleDriverPick : undefined}
          focusedIndex={rolodexCursor}
        />
        {state.phase === "dogReveal" && (
          <PeekNextGuest guest={revealedGuest} onChoose={handleDog} />
        )}
        {state.phase === "summary" && (
          <SummaryModal state={state} onConfirm={handleConfirmSummary} />
        )}
      </div>
    </div>
  );
}
