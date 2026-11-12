import { GUEST_TYPES, HOUSE_EXPANSION_COSTS, buildTestShop } from "./guests.js";

const MAX_CASH = 30;
const MAX_POPULARITY = 60;
const MAX_HOUSE_CAPACITY = 34;
const TROUBLE_THRESHOLD = 3;

function defaultIdGen() {
  return crypto.randomUUID();
}

function makeGuest(type, id, order) {
  return { id, type, abilityUsed: false, order };
}

/**
 * Creates the starting game state with a shuffled rolodex.
 *
 * Deck starts with 4 oldFriends, 2 richPals, and 4 wildBuddies; house capacity
 * begins at 5 and the game runs for 24 nights.
 *
 * @param {object} [options] - Optional overrides for testing.
 * @param {function} [options.idGen] - UUID generator; defaults to crypto.randomUUID.
 * @param {function} [options.shuffleFn] - Array shuffle function; defaults to Fisher-Yates.
 * @returns {object} The full initial game state.
 */
export function createInitialState({
  idGen = defaultIdGen,
  shuffleFn = shuffleArray,
  mode = "classic",
} = {}) {
  const rolodex = [];
  for (let i = 0; i < 4; i++)
    rolodex.push(makeGuest("oldFriend", idGen(), rolodex.length));
  for (let i = 0; i < 2; i++)
    rolodex.push(makeGuest("richPal", idGen(), rolodex.length));
  for (let i = 0; i < 4; i++)
    rolodex.push(makeGuest("wildBuddy", idGen(), rolodex.length));
  return {
    phase: "party",
    nightsLeft: 24,
    cash: 0,
    popularity: 0,
    trouble: 0,
    house: [],
    houseCapacity: 5,
    rolodex: shuffleFn(rolodex),
    bannedThisParty: [],
    dogRevealGuestId: null,
    blameContext: null,
    houseCostIndex: 0,
    purchasedCounts: {},
    nextOrder: rolodex.length,
    mode,
    testShop: mode === "test" ? buildTestShop(shuffleFn) : null,
  };
}

/**
 * Counts the number of star guests currently in the house.
 *
 * Star status is a static property on the guest type definition; currently only
 * the alien qualifies.
 *
 * @param {Array} house - Array of guest objects currently in the house.
 * @returns {number} Number of guests with hasStar set to true.
 */
export function countStars(house) {
  return house.filter((g) => GUEST_TYPES[g.type].hasStar).length;
}

/**
 * Computes the popularity and cash earned for the current house lineup.
 *
 * Dancer pop scales as count² rather than linearly. Comedians grant +5 pop
 * each only when the house is exactly at capacity. All other bonuses are
 * additive per their GUEST_TYPES definition.
 *
 * @param {Array} house - Array of guest objects in the house.
 * @param {number} houseCapacity - The maximum number of guests the house holds.
 * @returns {{ pop: number, cash: number }} Total popularity and cash earned this night.
 * @example
 * // Two dancers score 4 pop (2²), one comedian in a full house of 2 adds 5 pop
 * scoreHouse([{ type: 'dancer' }, { type: 'comedian' }], 2);
 * // => { pop: 9, cash: -1 }
 */
export function scoreHouse(house, houseCapacity) {
  const dancerCount = house.filter((g) => g.type === "dancer").length;
  const dancerPop = dancerCount * dancerCount;
  const comedianCount = house.filter((g) => g.type === "comedian").length;
  const isFull = house.length === houseCapacity;
  const comedianBonus = isFull ? comedianCount * 5 : 0;

  let pop = dancerPop + comedianBonus;
  let cash = 0;
  for (const g of house) {
    const def = GUEST_TYPES[g.type];
    if (g.type === "dancer") {
      // dancer pop already counted
      cash += def.cashBonus;
    } else {
      pop += def.popBonus;
      cash += def.cashBonus;
    }
  }
  return { pop, cash };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function markAbilityUsed(house, guestId) {
  return house.map((g) => (g.id === guestId ? { ...g, abilityUsed: true } : g));
}

// Does any guest in house have an unused ability (other than fullHouseBonus, which is passive)?
function anyUnusedAbilities(house) {
  return house.some((g) => {
    const def = GUEST_TYPES[g.type];
    if (!def.ability) return false;
    if (def.ability === "fullHouseBonus") return false;
    if (def.ability === "removeTrouble") return false;
    return !g.abilityUsed;
  });
}

function shouldAutoEnd(state) {
  return (
    state.house.length === state.houseCapacity &&
    !anyUnusedAbilities(state.house)
  );
}

/**
 * Moves a guest from the rolodex into the house and resolves immediate side effects.
 *
 * Trouble guests increment the trouble counter; reaching 3 transitions to the
 * 'blame' phase. Mr. Popular (autoInvite ability) automatically pulls in the
 * next unbanned rolodex guest. If the house is full and no active abilities
 * remain unused, the party ends automatically.
 *
 * @param {{ phase: string, rolodex: Array, house: Array, trouble: number, houseCapacity: number, bannedThisParty: Array }} state - Current game state.
 * @param {string} guestId - ID of the guest to invite from the rolodex.
 * @returns {object} Updated state; phase may change to 'blame' or 'summary'.
 */
export function addGuestToParty(state, guestId) {
  const guestIdx = state.rolodex.findIndex((g) => g.id === guestId);
  if (guestIdx === -1) return state;
  const guest = state.rolodex[guestIdx];
  const def = GUEST_TYPES[guest.type];
  const nextRolodex = state.rolodex.filter((g) => g.id !== guestId);
  const nextHouse = [...state.house, guest];
  let next = { ...state, rolodex: nextRolodex, house: nextHouse };

  if (def.trouble) {
    next = { ...next, trouble: next.trouble + 1 };
  }

  const hippieCount = (state) =>
    state.house.filter((g) => g.type === "hippie").length;

  if (next.trouble >= TROUBLE_THRESHOLD + hippieCount(next)) {
    return { ...next, phase: "blame", blameContext: "trouble" };
  }

  // Mr. Popular ability: auto-invite next unbanned guest
  if (def.ability === "autoInvite") {
    const nextGuest = next.rolodex.find(
      (g) => !next.bannedThisParty.includes(g.id),
    );
    if (nextGuest) {
      const nextDef = GUEST_TYPES[nextGuest.type];
      const afterRolodex = next.rolodex.filter((g) => g.id !== nextGuest.id);
      const afterHouse = [...next.house, nextGuest];
      next = { ...next, rolodex: afterRolodex, house: afterHouse };
      if (nextDef.trouble) {
        next = { ...next, trouble: next.trouble + 1 };
      }
      if (next.trouble >= TROUBLE_THRESHOLD + hippieCount(next)) {
        return { ...next, phase: "blame", blameContext: "trouble" };
      }
      if (next.house.length > next.houseCapacity) {
        return { ...next, phase: "blame", blameContext: "overcapacity" };
      }
    }
  }

  if (shouldAutoEnd(next)) {
    return endParty(next);
  }
  return next;
}

/**
 * Transitions the game to the summary phase.
 *
 * @param {object} state - Current game state.
 * @returns {object} State with phase set to 'summary'.
 */
export function endParty(state) {
  return { ...state, phase: "summary", driverMode: null };
}

/**
 * Completes a driver ability pick by inviting the chosen rolodex guest.
 *
 * Clears driverMode and delegates to addGuestToParty, so trouble and auto-invite
 * logic applies normally. Returns state unchanged if the target is banned or absent.
 *
 * @param {object} state - Current game state; must have driverMode set.
 * @param {string} targetGuestId - ID of the rolodex guest to invite.
 * @returns {object} Updated state with the chosen guest added to the house.
 */
export function driverPickGuest(state, targetGuestId) {
  if (state.bannedThisParty.includes(targetGuestId)) return state;
  return addGuestToParty({ ...state, driverMode: null }, targetGuestId);
}

/**
 * Applies the night's score, advances to the shop phase, and returns house guests to the rolodex.
 *
 * Popularity is clamped to 0–60 and cash to 0–30. Night count decrements by 1.
 *
 * @param {object} state - Current game state; must be in 'summary' phase.
 * @returns {object} Updated state with accumulated pop/cash, phase set to 'shop', and house guests merged back into the rolodex.
 */
export function confirmSummary(state) {
  const { pop, cash } = scoreHouse(state.house, state.houseCapacity);
  return {
    ...state,
    popularity: clamp(state.popularity + pop, 0, MAX_POPULARITY),
    cash: clamp(state.cash + cash, 0, MAX_CASH),
    nightsLeft: state.nightsLeft - 1,
    phase: "shop",
    rolodex: [...state.rolodex, ...state.house],
    testShop: state.mode === "test" ? buildTestShop() : null,
  };
}

/**
 * Ejects the blamed guest, clears trouble, advances to the shop phase, and deducts a night.
 *
 * The ejected guest is added to bannedThisParty so they will not be invited for
 * the remainder of this party. Remaining house guests are returned to the rolodex.
 *
 * @param {object} state - Current game state; must be in 'blame' phase.
 * @param {string} guestId - ID of the guest to eject and ban for this party.
 * @returns {object} Updated state with the guest removed, trouble reset to 0, and phase set to 'shop'.
 */
export function blameGuest(state, guestId) {
  const nextHouse = state.house.filter((g) => g.id !== guestId);
  return {
    ...state,
    house: nextHouse,
    bannedThisParty: [guestId],
    nightsLeft: state.nightsLeft - 1,
    trouble: 0,
    phase: "shop",
    blameContext: null,
    driverMode: null,
    rolodex: [...state.rolodex, ...nextHouse],
    testShop: state.mode === "test" ? buildTestShop() : null,
  };
}

/**
 * Activates the ability of a house guest and applies its immediate effect.
 *
 * Dispatches based on the guest type's ability field:
 * - `driver`: pulls the next unbanned rolodex guest into the house.
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

  switch (def.ability) {
    case "driver": {
      return {
        ...state,
        house: markAbilityUsed(state.house, guestId),
        driverMode: { driverId: guestId },
      };
    }
    case "reveal": {
      const nextGuest = state.rolodex.find(
        (g) => !state.bannedThisParty.includes(g.id),
      );
      if (!nextGuest) return state;
      return {
        ...state,
        dogRevealGuestId: nextGuest.id,
        phase: "dogReveal",
        house: markAbilityUsed(state.house, guestId),
      };
    }
    case "kick": {
      return { ...state, kickMode: { kickerId: guestId } };
    }
    default:
      return state;
  }
}

/**
 * Executes a kick: removes the target from the house and bans them for the rest of this party.
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
  const targetIsTrouble = target && GUEST_TYPES[target.type].trouble;
  const house = markAbilityUsed(state.house, kickerId).filter(
    (g) => g.id !== targetId,
  );
  const { kickMode, ...rest } = state;
  return {
    ...rest,
    house,
    bannedThisParty: [...state.bannedThisParty, targetId],
    trouble: targetIsTrouble ? Math.max(0, state.trouble - 1) : state.trouble,
  };
}

/**
 * Resolves the dog's peek: either removes the revealed guest or leaves them in the rolodex.
 *
 * Always clears dogRevealGuestId and returns to the 'party' phase regardless of choice.
 *
 * @param {object} state - Current game state; must be in 'dogReveal' phase.
 * @param {'boot' | 'keep'} choice - 'boot' removes the guest from the rolodex permanently; 'keep' leaves them in place.
 * @returns {object} Updated state with phase set back to 'party'.
 */
export function confirmDogReveal(state, choice) {
  const id = state.dogRevealGuestId;
  const rolodex =
    choice === "boot"
      ? state.rolodex.filter((g) => g.id !== id)
      : state.rolodex;
  return {
    ...state,
    rolodex,
    dogRevealGuestId: null,
    phase: "party",
  };
}

/**
 * Purchases a guest type from the shop and appends a new instance to the rolodex.
 *
 * Returns state unchanged if: the type is not purchasable (shopCost is null),
 * the player lacks sufficient popularity, or the per-type purchase cap has been reached.
 *
 * @param {object} state - Current game state; must be in 'shop' phase.
 * @param {string} guestType - Key from GUEST_TYPES identifying the guest to buy.
 * @param {object} [options] - Optional overrides for testing.
 * @param {function} [options.idGen] - UUID generator; defaults to crypto.randomUUID.
 * @returns {object} Updated state with popularity reduced by shopCost and the new guest added to the rolodex.
 */
export function purchaseGuest(state, guestType, { idGen = defaultIdGen } = {}) {
  const def = GUEST_TYPES[guestType];
  if (!def || def.shopCost === null) return state;
  const current = state.purchasedCounts[guestType] || 0;
  if (current >= def.maxPurchase) return state;
  if (state.popularity < def.shopCost) return state;
  return {
    ...state,
    popularity: state.popularity - def.shopCost,
    rolodex: [...state.rolodex, makeGuest(guestType, idGen(), state.nextOrder)],
    purchasedCounts: { ...state.purchasedCounts, [guestType]: current + 1 },
    nextOrder: state.nextOrder + 1,
  };
}

/**
 * Increases house capacity by 1 and deducts the current expansion cost from cash.
 *
 * Returns state unchanged if capacity is already at the maximum (34) or the
 * player cannot afford the cost. Cost rises with each purchase according to
 * HOUSE_EXPANSION_COSTS.
 *
 * @param {object} state - Current game state; must be in 'shop' phase.
 * @returns {object} Updated state with houseCapacity incremented and cash reduced, or unchanged if the purchase was not possible.
 */
export function expandHouse(state) {
  if (state.houseCapacity >= MAX_HOUSE_CAPACITY) return state;
  const cost = HOUSE_EXPANSION_COSTS(state.houseCostIndex);
  if (state.cash < cost) return state;
  return {
    ...state,
    cash: state.cash - cost,
    houseCapacity: state.houseCapacity + 1,
    houseCostIndex: state.houseCostIndex + 1,
  };
}

/**
 * Resets the house and rolodex for the next party night.
 *
 * Clears the house array, resets trouble to 0, and returns all rolodex guests
 * to the deck with their abilityUsed flags reset before shuffling. bannedThisParty
 * is not cleared here — it persists from the blameGuest call that preceded the shop.
 *
 * @param {object} state - Current game state; must be in 'shop' phase.
 * @param {function} [shuffleFn] - Array shuffle function; defaults to Fisher-Yates.
 * @returns {object} Updated state with phase set to 'party' and a freshly shuffled rolodex.
 */
export function startNextParty(state, shuffleFn = shuffleArray) {
  const reset = state.rolodex.map((g) => ({ ...g, abilityUsed: false }));
  return {
    ...state,
    phase: "party",
    trouble: 0,
    house: [],
    rolodex: shuffleFn(reset),
    // bannedThisParty persists one party (set by blameGuest before shop)
  };
}

function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
