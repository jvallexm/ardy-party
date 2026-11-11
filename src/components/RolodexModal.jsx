import React from 'react';
import GuestGrid from './GuestGrid.jsx';

const byOrder = (a, b) => a.order - b.order;

/**
 * Modal overlay displaying all guests in the rolodex, sorted by acquisition order.
 *
 * Returns null when closed. When houseGuests is provided, those guests are shown
 * grayed-out after a visual separator to indicate they are currently at the party.
 * The guest count reflects the full roster (available + at party).
 *
 * @param {object} props
 * @param {boolean} props.open - When false the modal is not rendered.
 * @param {Array} props.rolodex - Guests available to invite (not currently in house).
 * @param {Array} [props.houseGuests=[]] - Guests currently at the party; shown grayed-out.
 * @param {function} props.onClose - Called when the close button is clicked or Escape/Space is pressed.
 * @returns {React.ReactElement | null} The rolodex modal, or null when closed.
 */
export default function RolodexModal({ open, rolodex, houseGuests = [], onClose, onGuestPick }) {
  if (!open) return null;
  const total = rolodex.length + houseGuests.length;
  const sorted = [...rolodex].sort(byOrder);
  const sortedHouse = [...houseGuests].sort(byOrder);
  const title = onGuestPick ? 'Pick a Guest to Invite' : 'Rolodex';
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="title-bar">
          <span>{title}</span>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="close"
          >
            ×
          </button>
        </div>
        <div className="window-body">
          <p>{total} guest{total === 1 ? '' : 's'}{houseGuests.length > 0 ? ` (${houseGuests.length} at party)` : ''}</p>
          <GuestGrid guests={sorted} onGuestClick={onGuestPick} />
          {sortedHouse.length > 0 && (
            <>
              <hr className="rolodex-separator" />
              <GuestGrid guests={sortedHouse} inactive />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
