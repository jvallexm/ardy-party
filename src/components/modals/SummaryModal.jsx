import React from "react";
import { GUEST_TYPES } from "../../lib/guests.js";
import { scoreHouse } from "../../lib/gameState.js";
import { formatBonus as fmt } from "../../lib/display.js";

/**
 * Modal overlay showing per-guest and total scoring for the night just ended.
 *
 * Calls scoreHouse to compute the totals and renders each house guest's
 * pop and cash bonuses in a table. Rows with a zero bonus for a resource
 * leave that cell blank. Totals are shown in the table footer. Confirming
 * advances to the shop phase via confirmSummary.
 *
 * @param {object} props
 * @param {object} props.state - Current game state; must be in 'summary' phase.
 * @param {function} props.onConfirm - Called when the "Go to Shop" button is clicked.
 * @returns {React.ReactElement} The night results modal.
 */
export default function SummaryModal({ state, onConfirm }) {
  const { pop, cash } = scoreHouse(state.house, state.houseCapacity);
  const dancerCount = state.house.filter((g) => g.type === "dancer").length;
  const dancerDef = GUEST_TYPES.dancer;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="title-bar">
          <span>Night Results</span>
        </div>
        <div className="window-body">
          <table className="summary-table">
            <tbody>
              {state.house
                .filter((g) => g.type !== "dancer")
                .map((g) => {
                  const def = GUEST_TYPES[g.type];
                  return (
                    <tr key={g.id}>
                      <td>{def.emoji}</td>
                      <td>{def.name}</td>
                      <td className="summary-pop">
                        {def.popBonus !== 0 ? fmt(def.popBonus) + " pop" : ""}
                      </td>
                      <td className="summary-cash">
                        {def.cashBonus !== 0
                          ? fmt(def.cashBonus) + " cash"
                          : ""}
                      </td>
                    </tr>
                  );
                })}
              {dancerCount > 0 && (
                <tr>
                  <td>{dancerDef.emoji}</td>
                  <td>
                    {dancerDef.name} (x{dancerCount})
                  </td>
                  <td className="summary-pop">
                    {fmt(dancerCount * dancerCount)} pop
                  </td>
                  <td className="summary-cash"></td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>Total</strong>
                </td>
                <td className="summary-pop">
                  <strong>{fmt(pop)} pop</strong>
                </td>
                <td className="summary-cash">
                  <strong>{fmt(cash)} cash</strong>
                </td>
              </tr>
            </tfoot>
          </table>
          <button type="button" className="btn" onClick={onConfirm}>
            Go to Shop
          </button>
        </div>
      </div>
    </div>
  );
}
