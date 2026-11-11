import React from 'react';
import GuestTile from './GuestTile.jsx';

/**
 * Renders the party house grid during the main party phase.
 *
 * Tile layout: index 0 is the rolodex opener button, index 1 is the door button
 * (disabled when no unbanned guests remain or the house is full), indices 2+
 * correspond to house guests in order, and remaining slots render as empty tiles
 * up to houseCapacity.
 *
 * @param {object} props
 * @param {object} props.state - Current game state.
 * @param {function} props.onOpenRolodex - Called when the rolodex tile is clicked.
 * @param {function} props.onDoor - Called when the door tile is clicked to invite the next guest.
 * @param {function} props.onGuestClick - Called with a guest object when a guest tile is clicked.
 * @param {number} [props.focusedTileIndex=-1] - Flat tile index to highlight as keyboard-focused; -1 means no focus.
 * @returns {React.ReactElement} The house grid window.
 */
export default function House({ state, onOpenRolodex, onDoor, onGuestClick, focusedTileIndex = -1 }) {
  const availableRolodex = state.rolodex.filter(
    (g) => !state.bannedThisParty.includes(g.id),
  );
  const doorDisabled =
    availableRolodex.length === 0 || state.house.length >= state.houseCapacity;
  const emptyCount = Math.max(0, state.houseCapacity - state.house.length);

  return (
    <div className="window">
      <div className="title-bar"><span>House</span></div>
      <div className="window-body">
        <div className="house-grid">
          <button
            type="button"
            className={`tile${focusedTileIndex === 0 ? ' focused' : ''}`}
            onClick={onOpenRolodex}
          >
            <span style={{ fontSize: 24 }}>📇</span>
            <span style={{ position: 'absolute', bottom: 2, fontSize: 9 }}>
              Rolodex
            </span>
          </button>
          <button
            type="button"
            className={`tile${focusedTileIndex === 1 ? ' focused' : ''}`}
            onClick={onDoor}
            disabled={doorDisabled}
          >
            <span style={{ fontSize: 24 }}>🚪</span>
            <span style={{ position: 'absolute', bottom: 2, fontSize: 9 }}>
              Door
            </span>
          </button>
          {state.house.map((g, i) => (
            <GuestTile
              key={g.id}
              guest={g}
              onClick={onGuestClick}
              focused={focusedTileIndex === i + 2}
            />
          ))}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <div
              key={`e${i}`}
              className={`tile empty${focusedTileIndex === state.house.length + 2 + i ? ' focused' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
