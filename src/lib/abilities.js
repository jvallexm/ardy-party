import {
  GUEST_TYPES,
  markAbilityUsed,
  computeTrouble,
} from "./guests/index.js";

export function anyUnusedAbilities(house) {
  return house.some((g) => GUEST_TYPES[g.type].onUse && !g.abilityUsed);
}

/**
 * Activates the ability of a house guest and applies its immediate effect.
 *
 * Dispatches based on the guest type's ability field:
 * - `driver`: sets driverMode, awaiting a rolodex pick.
 * - `removeTrouble`: decrements trouble by 1 (minimum 0).
 * - `reveal`: enters the 'dogReveal' phase to preview the next rolodex guest.
 * - `kick`: sets kickMode on state, awaiting a target selection.
 *
 * Returns state unchanged if the guest is not found, the ability is already
 * used, or no ability exists.
 *
 * @param {object} state - Current game state.
 * @param {string} guestId - ID of the house guest whose ability to activate.
 * @returns {object} Updated state reflecting the ability's effect.
 */
export function activateAbility(state, guestId) {
  const guest = state.house.find((g) => g.id === guestId);
  if (!guest) return state;
  if (guest.abilityUsed) return state;
  const def = GUEST_TYPES[guest.type];
  if (!def.ability) return state;
  if (!def.onUse) return state;
  return def.onUse(state, guestId);
}

/**
 * Executes a kick: removes the target from the house, returns them to the rolodex,
 * and bans them for the rest of this party.
 *
 * Also marks the kicker's ability as used and clears kickMode. If the target
 * was a trouble guest their removal decrements the trouble counter by 1.
 *
 * @param {object} state - Current game state; must have kickMode set.
 * @param {string} kickerId - ID of the security guard initiating the kick.
 * @param {string} targetId - ID of the guest to remove and ban.
 * @returns {object} Updated state with target removed, kickMode cleared, and trouble adjusted if applicable.
 */
export function kickGuest(state, kickerId, targetId) {
  const target = state.house.find((g) => g.id === targetId);
  const house = markAbilityUsed(state.house, kickerId).filter(
    (g) => g.id !== targetId,
  );
  const { kickMode, ...rest } = state;
  return {
    ...rest,
    house,
    rolodex: target ? [...state.rolodex, target] : state.rolodex,
    bannedThisParty: [...state.bannedThisParty, targetId],
    trouble: computeTrouble(house),
  };
}

/**
 * Resolves the dog's peek: either bans the revealed guest for this party or leaves them in place.
 *
 * Always clears dogRevealGuestId and returns to the 'party' phase regardless of choice.
 *
 * @param {object} state - Current game state; must be in 'dogReveal' phase.
 * @param {'boot' | 'keep'} choice - 'boot' bans the guest for this party; 'keep' leaves them in rolodex.
 * @returns {object} Updated state with phase set back to 'party'.
 */
export function confirmDogReveal(state, choice) {
  const id = state.dogRevealGuestId;
  const bannedThisParty =
    choice === "boot" ? [...state.bannedThisParty, id] : state.bannedThisParty;
  return {
    ...state,
    bannedThisParty,
    dogRevealGuestId: null,
    phase: "party",
  };
}
