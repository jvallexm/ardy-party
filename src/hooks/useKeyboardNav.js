import { useEffect } from "react";
import { SHOP_GUESTS } from "../lib/guests.js";
import { confirmDogReveal } from "../lib/gameState.js";

const COLS = 9;

/**
 * Registers a keydown listener that drives all keyboard navigation across game phases.
 *
 * WASD and arrow keys move focus; Space (and Enter in summary) confirms the
 * current selection. In the party phase, row -1 targets the End Party button
 * in the HUD. Tile indices map as: 0 = rolodex opener, 1 = door, 2+ = house guests.
 * Each phase has its own cursor state; this hook wires them all together.
 *
 * @param {object} opts - Navigation dependencies.
 * @param {object} opts.state - Current game state.
 * @param {function} opts.setState - Game state setter.
 * @param {{ row: number, col: number }} opts.cursor - Party-phase grid cursor.
 * @param {function} opts.setCursor - Party cursor setter.
 * @param {number} opts.blameCursor - Flat index of focused guest in blame phase.
 * @param {function} opts.setBlameCursor - Blame cursor setter.
 * @param {number} opts.shopCursor - Flat index of focused item in shop phase.
 * @param {function} opts.setShopCursor - Shop cursor setter.
 * @param {boolean} opts.rolodexOpen - Whether the rolodex modal is currently open.
 * @param {function} opts.setRolodexOpen - Rolodex open state setter.
 * @param {function} opts.handleConfirmSummary - Callback to confirm the night summary.
 * @param {function} opts.handleBlame - Callback invoked with a guest ID to assign blame.
 * @param {function} opts.handleBuy - Callback invoked with a guest type key to purchase.
 * @param {function} opts.handleExpand - Callback to expand house capacity.
 * @param {function} opts.handleNext - Callback to start the next party.
 * @param {function} opts.handleEndParty - Callback to end the current party early.
 * @param {function} opts.handleDoor - Callback to invite the next rolodex guest via the door.
 * @param {function} opts.handleGuestClick - Callback invoked with a guest object when activated.
 */
export default function useKeyboardNav({
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
  handleConfirmSummary,
  handleBlame,
  handleBuy,
  handleExpand,
  handleNext,
  handleEndParty,
  handleDoor,
  handleGuestClick,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key.startsWith("Arrow")) e.preventDefault();

      if (rolodexOpen) {
        if (e.key === "Escape" || e.key === " ") {
          e.preventDefault();
          setRolodexOpen(false);
        }
        return;
      }

      const { phase } = state;

      if (phase === "summary") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleConfirmSummary();
        }
        return;
      }

      if (phase === "dogReveal") {
        if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft")
          setState(confirmDogReveal(state, "boot"));
        if (e.key === "d" || e.key === "D" || e.key === "ArrowRight")
          setState(confirmDogReveal(state, "keep"));
        return;
      }

      if (phase === "blame") {
        const max = state.house.length - 1;
        let next = blameCursor;
        if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft")
          next = Math.max(0, blameCursor - 1);
        else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight")
          next = Math.min(max, blameCursor + 1);
        else if (e.key === "w" || e.key === "W" || e.key === "ArrowUp")
          next = Math.max(0, blameCursor - COLS);
        else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown")
          next = Math.min(max, blameCursor + COLS);
        else if (e.key === " ") {
          e.preventDefault();
          handleBlame(state.house[blameCursor].id);
          return;
        }
        if (next !== blameCursor) setBlameCursor(next);
        return;
      }

      if (phase === "shop") {
        const shopGuests = state.testShop ?? SHOP_GUESTS;
        const totalItems = shopGuests.length + 2;
        let next = shopCursor;
        if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft")
          next = shopCursor === 0 ? totalItems - 1 : shopCursor - 1;
        else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight")
          next = Math.min(totalItems - 1, shopCursor + 1);
        else if (e.key === "w" || e.key === "W" || e.key === "ArrowUp")
          next = Math.max(0, shopCursor - COLS);
        else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown")
          next = Math.min(totalItems - 1, shopCursor + COLS);
        else if (e.key === " ") {
          e.preventDefault();
          if (shopCursor < shopGuests.length)
            handleBuy(shopGuests[shopCursor]);
          else if (shopCursor === shopGuests.length) handleExpand();
          else handleNext();
          return;
        }
        if (next !== shopCursor) setShopCursor(next);
        return;
      }

      // party phase — row -1 means End Party (HUD) is focused
      if (cursor.row === -1) {
        if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
          setCursor({ row: 0, col: 0 });
        } else if (e.key === " ") {
          e.preventDefault();
          handleEndParty();
        }
        return;
      }

      const totalTiles = state.houseCapacity + 2;
      const rows = Math.ceil(totalTiles / COLS);
      let { row, col } = cursor;
      let moved = false;

      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        col--;
        if (col < 0) {
          row--;
          col = COLS - 1;
        }
        moved = true;
      } else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        col++;
        if (col >= COLS) {
          row++;
          col = 0;
        }
        moved = true;
      } else if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        if (row === 0) {
          setCursor({ row: -1, col: 0 });
          return;
        }
        row--;
        moved = true;
      } else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
        row++;
        moved = true;
      } else if (e.key === " ") {
        e.preventDefault();
        const tileIdx = cursor.row * COLS + cursor.col;
        if (tileIdx === 0) {
          setRolodexOpen(true);
        } else if (tileIdx === 1) {
          const avail = state.rolodex.filter(
            (g) => !state.bannedThisParty.includes(g.id),
          );
          const doorDisabled =
            avail.length === 0 || state.house.length >= state.houseCapacity;
          if (!doorDisabled) handleDoor();
        } else {
          const guestIdx = tileIdx - 2;
          if (guestIdx < state.house.length)
            handleGuestClick(state.house[guestIdx]);
        }
        return;
      }

      if (moved) {
        row = Math.max(0, Math.min(rows - 1, row));
        const idx = row * COLS + col;
        if (idx >= totalTiles) {
          const lastIdx = totalTiles - 1;
          row = Math.floor(lastIdx / COLS);
          col = lastIdx % COLS;
        }
        setCursor({ row, col });
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state, cursor, rolodexOpen, blameCursor, shopCursor]); // eslint-disable-line react-hooks/exhaustive-deps
}
