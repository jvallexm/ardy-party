import React, { useState } from "react";
import {
  SHOP_GUESTS,
  GUEST_TYPES,
  HOUSE_EXPANSION_COSTS,
} from "../lib/guests.js";
import TileVisuals from "./TileVisuals.jsx";

const MAX_CAPACITY = 34;

/**
 * Renders the between-party shop where players spend popularity on guests and cash on house expansions.
 *
 * Items are listed in ascending shopCost order from SHOP_GUESTS. Guest tiles are
 * disabled when the player cannot afford them or the per-type cap is reached.
 * The house expansion tile is disabled when cash is insufficient or capacity is
 * already at the maximum (34). A "Start Next Party" button ends the shop phase;
 * it shows "Game Over" and disables itself when nightsLeft reaches 0.
 *
 * @param {object} props
 * @param {object} props.state - Current game state; must be in 'shop' phase.
 * @param {function} props.onBuy - Called with a guest type key when a shop tile is purchased.
 * @param {function} props.onExpand - Called when the house expansion tile is activated.
 * @param {function} props.onNext - Called when the Start Next Party tile is activated.
 * @param {function} props.onOpenRolodex - Called when the rolodex tile is clicked.
 * @param {number} [props.focusedIndex=-1] - Flat shop item index to highlight for keyboard nav.
 * @returns {React.ReactElement} The shop window.
 */
export default function Shop({
  state,
  onBuy,
  onExpand,
  onNext,
  onOpenRolodex,
  focusedIndex = -1,
  shopGuests = SHOP_GUESTS,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const expandCost = HOUSE_EXPANSION_COSTS(state.houseCostIndex);
  const expandDisabled =
    state.cash < expandCost || state.houseCapacity >= MAX_CAPACITY;
  const isGameOver = state.nightsLeft === 0;

  const activeIndex = hoveredIndex !== -1 ? hoveredIndex : focusedIndex;
  const activeKey = activeIndex >= 0 && activeIndex < shopGuests.length
    ? shopGuests[activeIndex]
    : null;
  const activeDescription = activeKey ? GUEST_TYPES[activeKey]?.description : null;

  return (
    <div className="window">
      <div className="title-bar">
        <span>Shop - {state.nightsLeft} Nights remaining</span>
      </div>
      <div className="window-body shop-body">
        <div className="hud-bar shop-stats">
          <span className="hud-item">Pop: {state.popularity}/60</span>
          <span className="hud-item">Cash: {state.cash}/30</span>
        </div>
        <div className="shop-grid">
          {shopGuests.map((key, i) => {
            if (key === null) {
              return (
                <div key={`sold-out-${i}`} className="shop-item">
                  <button
                    type="button"
                    aria-label="Sold Out"
                    className={`shop-tile${focusedIndex === i ? " focused" : ""}`}
                    disabled
                  >
                    🚫
                  </button>
                  <div className="shop-tile-info">
                    <div className="shop-tile-name">Sold Out</div>
                  </div>
                </div>
              );
            }
            const def = GUEST_TYPES[key];
            const purchased = state.purchasedCounts[key] || 0;
            const isUnlimited = def.maxPurchase === Infinity;
            const disabled =
              state.popularity < def.shopCost || purchased >= def.maxPurchase;
            return (
              <div key={key} className="shop-item">
                <button
                  type="button"
                  aria-label={def.name}
                  className={`shop-tile${focusedIndex === i ? " focused" : ""}`}
                  onClick={() => onBuy(key)}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(-1)}
                  disabled={disabled}
                >
                  <TileVisuals
                    guestType={key}
                    def={def}
                    showAbility={!!def.abilityIcon}
                  />
                </button>
                <div className="shop-tile-info">
                  <div className="shop-tile-name">{def.name}</div>
                  <div className="shop-tile-cost">{def.shopCost} pop</div>
                  <div className="shop-tile-count">
                    {isUnlimited ? "∞" : `${purchased}/${def.maxPurchase}`}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="shop-item">
            <button
              type="button"
              aria-label={`Expand House ($${expandCost} cash)`}
              className={`shop-tile${focusedIndex === shopGuests.length ? " focused" : ""}`}
              onClick={onExpand}
              disabled={expandDisabled}
            >
              🏠
            </button>
            <div className="shop-tile-info">
              <div className="shop-tile-name">
                Capacity: {state.houseCapacity}
              </div>
              <div className="shop-tile-cost">${expandCost} cash</div>
            </div>
          </div>
          <div className="shop-item">
            <button
              type="button"
              aria-label="Open Rolodex"
              className={`shop-tile${focusedIndex === shopGuests.length + 1 ? " focused" : ""}`}
              onClick={onOpenRolodex}
            >
              📒
            </button>
            <div className="shop-tile-info">
              <div className="shop-tile-name">
                Rolodex: {state.rolodex.length}
              </div>
            </div>
          </div>
          <div className="shop-item">
            <button
              type="button"
              aria-label={isGameOver ? "Game Over" : "Start Next Party"}
              className={`shop-tile${focusedIndex === shopGuests.length + 2 ? " focused" : ""}`}
              onClick={onNext}
              disabled={isGameOver}
            >
              🎉
            </button>
            <div className="shop-tile-info">
              <div className="shop-tile-name">
                {isGameOver ? "Game Over" : "Start Next Party"}
              </div>
            </div>
          </div>
        </div>
        <div className="shop-description">
          {activeDescription || "\u00a0"}
        </div>
      </div>
    </div>
  );
}
