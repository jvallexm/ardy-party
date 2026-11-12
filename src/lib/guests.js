// Guest type definitions. Each guest type is a static description;
// per-party state (id, abilityUsed) lives on the guest instance.

export const GUEST_TYPES = {
  oldFriend: {
    name: "Old Friend",
    emoji: "🧑",
    popBonus: 1,
    cashBonus: 0,
    trouble: false,
    ability: null,
    abilityIcon: null,
    hasStar: false,
    shopCost: 2,
    maxPurchase: 4,
    description: null,
  },
  wildBuddy: {
    name: "Wild Buddy",
    emoji: "🤪",
    popBonus: 2,
    cashBonus: 0,
    trouble: true,
    ability: null,
    abilityIcon: "❌",
    hasStar: false,
    shopCost: null,
    maxPurchase: 4,
    description: null,
  },
  richPal: {
    name: "Rich Pal",
    emoji: "💰",
    popBonus: 0,
    cashBonus: 1,
    trouble: false,
    ability: null,
    abilityIcon: null,
    hasStar: false,
    shopCost: 3,
    maxPurchase: 4,
    description: null,
  },
  driver: {
    name: "Driver",
    emoji: "🚗",
    popBonus: 0,
    cashBonus: 0,
    trouble: false,
    ability: "driver",
    abilityIcon: "⬇️",
    hasStar: false,
    shopCost: 3,
    maxPurchase: 4,
    description:
      "Click to open your rolodex and directly invite any guest of your choice",
  },
  monkey: {
    name: "Monkey",
    emoji: "🐒",
    popBonus: 4,
    cashBonus: 0,
    trouble: true,
    ability: null,
    abilityIcon: "❌",
    hasStar: false,
    shopCost: 4,
    maxPurchase: 4,
    description: null,
  },
  securityGuard: {
    name: "Security Guard",
    emoji: "💂",
    popBonus: 0,
    cashBonus: 0,
    trouble: false,
    ability: "kick",
    abilityIcon: "👢",
    hasStar: false,
    shopCost: 4,
    maxPurchase: 4,
    description: "Click to remove any guest from the party",
  },
  ticketTaker: {
    name: "Ticket Taker",
    emoji: "🎟️",
    popBonus: -1,
    cashBonus: 2,
    trouble: false,
    ability: null,
    abilityIcon: null,
    hasStar: false,
    shopCost: 4,
    maxPurchase: 4,
    description: null,
  },
  dog: {
    name: "Dog",
    emoji: "🐶",
    popBonus: 2,
    cashBonus: 0,
    trouble: false,
    ability: "reveal",
    abilityIcon: "👀",
    hasStar: false,
    shopCost: 4,
    maxPurchase: 4,
    description:
      "Click to preview the next guest in your rolodex — you can keep them or turn them away for the rest of this party.",
  },
  hippie: {
    name: "Hippie",
    emoji: "☮️",
    popBonus: 1,
    cashBonus: 0,
    trouble: false,
    ability: "removeTrouble",
    abilityIcon: "🏳️",
    hasStar: false,
    shopCost: 4,
    maxPurchase: 4,
    description:
      "While at the party, raises the trouble limit by 1 — you can have one more troublemaker before the blame phase triggers.",
  },
  auctioneer: {
    name: "Auctioneer",
    emoji: "🔨",
    popBonus: 0,
    cashBonus: 3,
    trouble: false,
    ability: null,
    abilityIcon: null,
    hasStar: false,
    shopCost: 9,
    maxPurchase: 4,
    description: null,
  },
  rockStar: {
    name: "Rock Star",
    emoji: "🎸",
    popBonus: 3,
    cashBonus: 2,
    trouble: true,
    ability: null,
    abilityIcon: "❌",
    hasStar: false,
    shopCost: 5,
    maxPurchase: 4,
    description: "+2 cash but adds 1 trouble.",
  },
  comedian: {
    name: "Comedian",
    emoji: "😂",
    popBonus: 0,
    cashBonus: -1,
    trouble: false,
    ability: "fullHouseBonus",
    abilityIcon: null,
    hasStar: false,
    shopCost: 5,
    maxPurchase: 4,
    description: "+5 popularity at end of night when there is a full house.",
  },
  caterer: {
    name: "Caterer",
    emoji: "🍽️",
    popBonus: 4,
    cashBonus: -1,
    trouble: false,
    ability: null,
    abilityIcon: null,
    hasStar: false,
    shopCost: 5,
    maxPurchase: 4,
    description: null,
  },
  mrPopular: {
    name: "Mr. Popular",
    emoji: "👑",
    popBonus: 3,
    cashBonus: 0,
    trouble: false,
    ability: "autoInvite",
    abilityIcon: "+1",
    hasStar: false,
    shopCost: 5,
    maxPurchase: 4,
    description:
      "When this guest enters the party, one additional guest is automatically invited from your rolodex.",
  },
  dancer: {
    name: "Dancer",
    emoji: "💃",
    popBonus: 0,
    cashBonus: 0,
    trouble: false,
    ability: null,
    abilityIcon: "🎵",
    hasStar: false,
    shopCost: 7,
    maxPurchase: 4,
    description:
      "Popularity scales as dancer count squared: 1 dancer = +1, 2 = +4, 3 = +9, 4 = +16.",
  },
  alien: {
    name: "Alien",
    emoji: "👽",
    popBonus: 0,
    cashBonus: 0,
    trouble: false,
    ability: null,
    abilityIcon: null,
    hasStar: true,
    shopCost: 40,
    maxPurchase: Infinity,
    description: null,
  },
};

export const SHOP_GUESTS = Object.keys(GUEST_TYPES)
  .filter((key) => GUEST_TYPES[key].shopCost !== null)
  .sort((a, b) => GUEST_TYPES[a].shopCost - GUEST_TYPES[b].shopCost);

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TEST_POOL_A = ["monkey", "driver", "securityGuard", "ticketTaker", "hippie", "dog"];
const TEST_POOL_B = ["rockStar", "comedian", "caterer", "mrPopular"];
const TEST_POOL_C = ["dancer", "auctioneer"];

/**
 * Builds the randomized shop list for Test Mode.
 *
 * Always includes oldFriend, richPal, and alien (unless sold out). Randomly picks
 * 3 from pool A, 2 from pool B, and 1 from pool C — skipping any guest type whose
 * purchasedCounts has reached maxPurchase. Slots that cannot be filled are returned
 * as null ("Sold Out"). The full 9-element array is sorted by shopCost ascending,
 * with nulls sorted as Infinity so they appear after available guests.
 *
 * @param {function} [shuffleFn] - Array shuffle function; defaults to Fisher-Yates.
 * @param {object} [purchasedCounts] - Map of guest type key to number purchased so far.
 * @returns {Array<string|null>} 9-element array; null entries represent sold-out slots.
 * @example
 * buildTestShop((a) => a, {}); // deterministic, nothing sold out
 * buildTestShop((a) => a, { monkey: 4, driver: 4, securityGuard: 4 }); // some nulls
 */
export function buildTestShop(shuffleFn = shuffleArray, purchasedCounts = {}) {
  const isSoldOut = (key) =>
    (purchasedCounts[key] || 0) >= GUEST_TYPES[key].maxPurchase;

  const pickN = (pool, n) => shuffleFn([...pool]).slice(0, n);

  const selected = [
    "oldFriend",
    "richPal",
    "alien",
    ...pickN(TEST_POOL_A, 3),
    ...pickN(TEST_POOL_B, 2),
    ...pickN(TEST_POOL_C, 1),
  ];

  selected.sort((a, b) => GUEST_TYPES[a].shopCost - GUEST_TYPES[b].shopCost);

  return selected.map((k) => (isSoldOut(k) ? null : k));
}

/**
 * Returns the cash cost of the next house expansion.
 *
 * Cost formula is `index + 2`, capped at 12. The index starts at 0 and
 * increments each time the player expands, so costs are $2, $3, $4, $5, ...,
 * $12, $12, $12, ...
 *
 * @param {number} houseCostIndex - Number of expansions already purchased.
 * @returns {number} Cash cost of the next expansion.
 * @example
 * HOUSE_EXPANSION_COSTS(0); // => 2
 * HOUSE_EXPANSION_COSTS(10); // => 12
 */
export function HOUSE_EXPANSION_COSTS(houseCostIndex) {
  return Math.min(houseCostIndex + 2, 12);
}
