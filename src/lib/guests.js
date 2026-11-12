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
    description: "Invite any guest directly from your rolodex.",
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
    description: "Remove any guest from the party.",
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
      "Peek at the next rolodex guest. Keep or ban them for this party.",
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
    description: "+1 trouble limit while at the party.",
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
    description: null,
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
    description: "+5 pop at end of night if house is full.",
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
    description: "Auto-invites one more guest on arrival.",
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
    description: "1=+1 pop, 2=+4, 3=+9, 4=+16 (stacks with other dancers).",
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

const TEST_POOL_A = [
  "monkey",
  "driver",
  "securityGuard",
  "ticketTaker",
  "hippie",
  "dog",
];
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
  const available = (key) =>
    (purchasedCounts[key] || 0) < GUEST_TYPES[key].maxPurchase;

  const pickN = (pool, n) => {
    const avail = shuffleFn(pool.filter(available));
    const picks = avail.slice(0, n);
    return [...picks, ...Array(Math.max(0, n - picks.length)).fill(null)];
  };

  const alwaysSlots = ["oldFriend", "richPal", "alien"].map((k) =>
    available(k) ? k : null,
  );

  const slots = [
    ...alwaysSlots,
    ...pickN(TEST_POOL_A, 3),
    ...pickN(TEST_POOL_B, 2),
    ...pickN(TEST_POOL_C, 1),
  ];

  return slots.sort((a, b) => {
    const costA = a ? GUEST_TYPES[a].shopCost : Infinity;
    const costB = b ? GUEST_TYPES[b].shopCost : Infinity;
    return costA - costB;
  });
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
