import {
  S1_POOL_A,
  S1_POOL_B,
  S1_POOL_C,
  S2_POOL_A,
  S2_POOL_B,
  S2_POOL_C,
  S2_STAR_POOL,
} from "../constants.js";

export function markAbilityUsed(house, guestId) {
  return house.map((g) => (g.id === guestId ? { ...g, abilityUsed: true } : g));
}

export function computeTrouble(house) {
  const troubleCount = house.filter((g) => GUEST_TYPES[g.type].trouble).length;
  const whiteFlags = house.reduce(
    (sum, g) => sum + (GUEST_TYPES[g.type].static?.troubleBonus ?? 0),
    0,
  );
  return Math.max(0, troubleCount - whiteFlags);
}

function markUsed(state, guestId) {
  return { ...state, house: markAbilityUsed(state.house, guestId) };
}

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
    onUse(state, guestId) {
      return { ...markUsed(state, guestId), driverMode: { driverId: guestId } };
    },
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
    onUse(state, guestId) {
      return { ...state, kickMode: { kickerId: guestId } };
    },
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
    onUse(state, guestId) {
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
    },
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
    static: { troubleBonus: 1 },
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
    onScore(house, houseCapacity) {
      const count = house.filter((g) => g.type === "comedian").length;
      const isFull = house.length === houseCapacity;
      return { pop: isFull ? count * 5 : 0, cash: count * -1 };
    },
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
    onEnter(state, addGuest) {
      const nextGuest = state.rolodex.find(
        (g) => !state.bannedThisParty.includes(g.id),
      );
      if (!nextGuest) return state;
      return addGuest(state, nextGuest.id);
    },
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
    onScore(house) {
      const count = house.filter((g) => g.type === "dancer").length;
      return { pop: count * count, cash: 0 };
    },
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

  // Scenario 2 guests
  privateEye: {
    name: "Private Eye",
    emoji: "🕵️",
    popBonus: 2,
    cashBonus: -1,
    trouble: false,
    ability: "driver",
    abilityIcon: "⬇️",
    hasStar: false,
    shopCost: 4,
    maxPurchase: 4,
    description: null,
    onUse(state, guestId) {
      return { ...markUsed(state, guestId), driverMode: { driverId: guestId } };
    },
  },
  introvert: {
    name: "Introvert",
    emoji: "🤓",
    popBonus: 1,
    cashBonus: 0,
    trouble: false,
    ability: null,
    abilityIcon: null,
    hasStar: false,
    shopCost: 4,
    maxPurchase: 4,
    description: null,
    onScore(house, houseCapacity) {
      const count = house.filter((g) => g.type === "introvert").length;
      const emptyTiles = houseCapacity - house.length;
      return { pop: count * (1 + emptyTiles), cash: 0 };
    },
  },
  grillmaster: {
    name: "Grillmaster",
    emoji: "🥩",
    popBonus: 2,
    cashBonus: 0,
    trouble: false,
    ability: "refresh",
    abilityIcon: "🔄",
    hasStar: false,
    shopCost: 5,
    maxPurchase: 4,
    description: null,
    onUse(state, guestId) {
      const houseWithUsed = markAbilityUsed(state.house, guestId);
      const toReturn = houseWithUsed.filter(
        (g) => !state.bannedThisParty.includes(g.id),
      );
      return {
        ...state,
        house: [],
        trouble: 0,
        rolodex: [...state.rolodex, ...toReturn],
      };
    },
  },
  mascot: {
    name: "Mascot",
    emoji: "🧸",
    popBonus: 1,
    cashBonus: 0,
    trouble: false,
    ability: null,
    abilityIcon: "👥",
    hasStar: false,
    shopCost: 5,
    maxPurchase: 4,
    description: null,
    onScore(house) {
      const count = house.filter((g) => g.type === "mascot").length;
      const oldFriendCount = house.filter((g) => g.type === "oldFriend").length;
      return { pop: count * (1 + oldFriendCount), cash: 0 };
    },
  },
  gangster: {
    name: "Gangster",
    emoji: "🕴️",
    popBonus: 0,
    cashBonus: 4,
    trouble: true,
    ability: null,
    abilityIcon: "❌",
    hasStar: false,
    shopCost: 6,
    maxPurchase: 4,
    description: null,
  },
  cuteDog: {
    name: "Cute Dog",
    emoji: "🐶",
    popBonus: 2,
    cashBonus: 0,
    trouble: false,
    ability: "removeTrouble",
    abilityIcon: "🏳️",
    hasStar: false,
    shopCost: 7,
    maxPurchase: 4,
    description: null,
    static: { troubleBonus: 1 },
  },
  gambler: {
    name: "Gambler",
    emoji: "🎲",
    popBonus: 2,
    cashBonus: 3,
    trouble: true,
    ability: null,
    abilityIcon: "❌",
    hasStar: false,
    shopCost: 7,
    maxPurchase: 4,
    description: null,
  },
  spy: {
    name: "Spy",
    emoji: "🔍",
    popBonus: 0,
    cashBonus: 2,
    trouble: false,
    ability: "reveal",
    abilityIcon: "👀",
    hasStar: false,
    shopCost: 8,
    maxPurchase: 4,
    description: null,
    onUse(state, guestId) {
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
    },
  },
  writer: {
    name: "Writer",
    emoji: "✍️",
    popBonus: 1,
    cashBonus: 0,
    trouble: false,
    ability: null,
    abilityIcon: null,
    hasStar: false,
    shopCost: 8,
    maxPurchase: 4,
    description: null,
    onScore(house) {
      const count = house.filter((g) => g.type === "writer").length;
      const troubleCount = house.filter(
        (g) => GUEST_TYPES[g.type].trouble,
      ).length;
      return { pop: count * (1 + troubleCount * 2), cash: 0 };
    },
  },
  wrestler: {
    name: "Wrestler",
    emoji: "🤼",
    popBonus: 2,
    cashBonus: 0,
    trouble: false,
    ability: "kick",
    abilityIcon: "👢",
    hasStar: false,
    shopCost: 8,
    maxPurchase: 4,
    description: null,
    onUse(state, guestId) {
      return { ...state, kickMode: { kickerId: guestId } };
    },
  },
  climber: {
    name: "Climber",
    emoji: "🧗",
    popBonus: 0,
    cashBonus: 0,
    trouble: false,
    ability: null,
    abilityIcon: "➕",
    hasStar: false,
    shopCost: 12,
    maxPurchase: 4,
    description: null,
    onScore(house) {
      return {
        pop: house
          .filter((g) => g.type === "climber")
          .reduce((sum, g) => sum + (g.climberCount ?? 0), 0),
        cash: 0,
      };
    },
    onEnter(state, _addGuest, guestId) {
      return {
        ...state,
        house: state.house.map((g) =>
          g.id === guestId
            ? { ...g, climberCount: Math.min(9, (g.climberCount ?? 0) + 1) }
            : g,
        ),
      };
    },
  },
  mermaid: {
    name: "Mermaid",
    emoji: "🧜",
    popBonus: 0,
    cashBonus: 0,
    trouble: false,
    ability: "autoInvite",
    abilityIcon: "+1",
    hasStar: true,
    shopCost: 35,
    maxPurchase: Infinity,
    description: null,
    onEnter(state, addGuest) {
      const nextGuest = state.rolodex.find(
        (g) => !state.bannedThisParty.includes(g.id),
      );
      if (!nextGuest) return state;
      return addGuest(state, nextGuest.id);
    },
  },
  superhero: {
    name: "Superhero",
    emoji: "🦸",
    popBonus: 3,
    cashBonus: 0,
    trouble: false,
    ability: null,
    abilityIcon: null,
    hasStar: true,
    shopCost: 50,
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

export function buildTestShop(
  shuffleFn = shuffleArray,
  purchasedCounts = {},
  scenario = "s1",
) {
  const available = (key) =>
    (purchasedCounts[key] || 0) < GUEST_TYPES[key].maxPurchase;

  const pickN = (pool, n) => {
    const avail = shuffleFn(pool.filter(available));
    const picks = avail.slice(0, n);
    return [...picks, ...Array(Math.max(0, n - picks.length)).fill(null)];
  };

  let slots;
  if (scenario === "s2") {
    const alwaysSlots = ["oldFriend", "richPal"].map((k) =>
      available(k) ? k : null,
    );
    slots = [
      ...alwaysSlots,
      ...pickN(S2_STAR_POOL, 1),
      ...pickN(S2_POOL_A, 3),
      ...pickN(S2_POOL_B, 2),
      ...pickN(S2_POOL_C, 1),
    ];
  } else {
    const alwaysSlots = ["oldFriend", "richPal", "alien"].map((k) =>
      available(k) ? k : null,
    );
    slots = [
      ...alwaysSlots,
      ...pickN(S1_POOL_A, 3),
      ...pickN(S1_POOL_B, 2),
      ...pickN(S1_POOL_C, 1),
    ];
  }

  return slots.sort((a, b) => {
    const costA = a ? GUEST_TYPES[a].shopCost : Infinity;
    const costB = b ? GUEST_TYPES[b].shopCost : Infinity;
    return costA - costB;
  });
}

export function HOUSE_EXPANSION_COSTS(houseCostIndex) {
  return Math.min(houseCostIndex + 2, 12);
}
