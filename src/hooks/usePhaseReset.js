import { useEffect, useRef } from "react";

/**
 * Resets multiple state values whenever the game phase changes.
 *
 * Skips the initial render so cursors and UI state are only reset on
 * subsequent phase transitions, not on mount.
 *
 * @param {string} phase - The current game phase; changes to this value trigger the resets.
 * @param {Array<[function, *]>} resets - Pairs of [setter, resetValue] to call on each phase change.
 */
export default function usePhaseReset(phase, resets) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    for (const [setter, value] of resets) {
      setter(value);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
}
