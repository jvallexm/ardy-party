import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createInitialState,
  addGuestToParty,
  endParty,
  confirmSummary,
  blameGuest,
  purchaseGuest,
  expandHouse,
  startNextParty,
  countStars,
  scoreHouse,
  driverPickGuest,
} from "./gameState.js";
import { GUEST_TYPES } from "./guests.js";

// Deterministic id generator for tests
function makeIdGen() {
  let i = 0;
  return () => `id-${++i}`;
}

function makeGuest(type, id = "g1", abilityUsed = false) {
  return { id, type, abilityUsed };
}

describe("createInitialState", () => {
  it("populates rolodex with starting guests using provided id generator", () => {
    const state = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    expect(state.nightsLeft).toBe(24);
    expect(state.cash).toBe(0);
    expect(state.popularity).toBe(0);
    expect(state.trouble).toBe(0);
    expect(state.house).toEqual([]);
    expect(state.houseCapacity).toBe(5);
    expect(state.phase).toBe("party");
    expect(state.bannedThisParty).toEqual([]);
    expect(state.rolodex.length).toBe(10);
    const counts = state.rolodex.reduce((m, g) => {
      m[g.type] = (m[g.type] || 0) + 1;
      return m;
    }, {});
    expect(counts).toEqual({ oldFriend: 4, richPal: 2, wildBuddy: 4 });
    state.rolodex.forEach((g, i) => expect(g.id).toBe(`id-${i + 1}`));
  });

  it("defaults to crypto.randomUUID when no idGen is provided", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-x" });
    const state = createInitialState();
    expect(state.rolodex.every((g) => g.id === "uuid-x")).toBe(true);
  });

  it("starts with empty purchasedCounts and houseCostIndex 0", () => {
    const state = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    expect(state.purchasedCounts).toEqual({});
    expect(state.houseCostIndex).toBe(0);
    expect(state.dogRevealGuestId).toBeNull();
    expect(state.blameContext).toBeNull();
  });

  it("defaults to classic mode with no testShop", () => {
    const state = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    expect(state.mode).toBe("classic");
    expect(state.testShop).toBeNull();
  });

  it("test mode generates a testShop with 9 entries", () => {
    const state = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      mode: "test",
    });
    expect(state.mode).toBe("test");
    expect(state.testShop).not.toBeNull();
    expect(state.testShop.length).toBe(9);
  });

  it("defaults to scenario s1", () => {
    const state = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    expect(state.scenario).toBe("s1");
  });

  it("stores scenario s2 on state", () => {
    const state = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      scenario: "s2",
    });
    expect(state.scenario).toBe("s2");
  });

  it("does not include climberPopBonus on initial state", () => {
    const state = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    expect(state.climberPopBonus).toBeUndefined();
  });

  it("scenario 2 test mode builds shop from s2 pools", () => {
    const state = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      mode: "test",
      scenario: "s2",
    });
    expect(state.testShop).not.toBeNull();
    expect(state.testShop.length).toBe(9);
    expect(state.testShop).not.toContain("alien");
  });
});

describe("addGuestToParty", () => {
  let state;
  beforeEach(() => {
    state = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
  });

  it("moves a guest from rolodex to house", () => {
    const guestId = state.rolodex[0].id;
    const next = addGuestToParty(state, guestId);
    expect(next.house).toHaveLength(1);
    expect(next.house[0].id).toBe(guestId);
    expect(next.rolodex.find((g) => g.id === guestId)).toBeUndefined();
  });

  it("increments trouble when a trouble guest enters", () => {
    const wild = state.rolodex.find((g) => g.type === "wildBuddy");
    const next = addGuestToParty(state, wild.id);
    expect(next.trouble).toBe(1);
  });

  it("does not increment trouble for non-trouble guests", () => {
    const friend = state.rolodex.find((g) => g.type === "oldFriend");
    const next = addGuestToParty(state, friend.id);
    expect(next.trouble).toBe(0);
  });

  it("enters blame phase when trouble hits 3", () => {
    let s = state;
    const wilds = s.rolodex.filter((g) => g.type === "wildBuddy");
    s = addGuestToParty(s, wilds[0].id);
    s = addGuestToParty(s, wilds[1].id);
    s = addGuestToParty(s, wilds[2].id);
    expect(s.trouble).toBe(3);
    expect(s.phase).toBe("blame");
    expect(s.blameContext).toBe("trouble");
  });

  it("auto-invites next unbanned rolodex guest when mrPopular enters", () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: "mrPopular", abilityUsed: false };
    const friend = { id: idGen(), type: "oldFriend", abilityUsed: false };
    const alsoFriend = { id: idGen(), type: "oldFriend", abilityUsed: false };
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      rolodex: [mrPop, friend, alsoFriend],
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.house.map((g) => g.id)).toEqual([mrPop.id, friend.id]);
    expect(next.phase).toBe("party");
  });

  it("skips banned guests when mrPopular auto-invites", () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: "mrPopular", abilityUsed: false };
    const banned = { id: idGen(), type: "oldFriend", abilityUsed: false };
    const unbanned = { id: idGen(), type: "oldFriend", abilityUsed: false };
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const s = {
      ...base,
      rolodex: [mrPop, banned, unbanned],
      bannedThisParty: [banned.id],
      houseCapacity: 5,
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.house.map((g) => g.id)).toEqual([mrPop.id, unbanned.id]);
  });

  it("skips auto-invite when there are no more rolodex guests", () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: "mrPopular", abilityUsed: false };
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      rolodex: [mrPop],
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.house.map((g) => g.id)).toEqual([mrPop.id]);
    expect(next.phase).toBe("party");
  });

  it("enters blame phase when mrPopular auto-invites a trouble guest that pushes to 3", () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: "mrPopular", abilityUsed: false };
    const wild1 = { id: idGen(), type: "wildBuddy", abilityUsed: false };
    const wild2 = { id: idGen(), type: "wildBuddy", abilityUsed: false };
    const wild3 = { id: idGen(), type: "wildBuddy", abilityUsed: false };
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const s = {
      ...base,
      houseCapacity: 5,
      house: [wild1, wild2],
      rolodex: [mrPop, wild3],
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.trouble).toBe(3);
    expect(next.phase).toBe("blame");
    expect(next.blameContext).toBe("trouble");
  });

  it("enters blame phase (overcapacity) when mrPopular auto-invite exceeds capacity", () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: "mrPopular", abilityUsed: false };
    const other = { id: idGen(), type: "oldFriend", abilityUsed: false };
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      houseCapacity: 1,
      house: [],
      rolodex: [mrPop, other],
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.phase).toBe("blame");
    expect(next.blameContext).toBe("overcapacity");
    expect(next.house).toHaveLength(2);
  });

  it("auto-ends party when house full and no abilities remain", () => {
    const idGen = makeIdGen();
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const last = { id: idGen(), type: "oldFriend", abilityUsed: false };
    const s = {
      ...base,
      houseCapacity: 2,
      house: [{ id: "h1", type: "oldFriend", abilityUsed: false }],
      rolodex: [last],
    };
    const next = addGuestToParty(s, last.id);
    expect(next.phase).toBe("summary");
  });

  it("auto-ends when house full with only comedians (fullHouseBonus is passive)", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const comedian = { id: "c", type: "comedian", abilityUsed: false };
    const incoming = { id: "c2", type: "comedian", abilityUsed: false };
    const s = {
      ...base,
      houseCapacity: 2,
      house: [comedian],
      rolodex: [incoming],
    };
    const next = addGuestToParty(s, incoming.id);
    expect(next.phase).toBe("summary");
  });

  it("hippie in house raises trouble threshold so 3 trouble guests do not trigger blame", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    // 2 wilds already in house with hippie; net trouble = 2-1 = 1
    // adding a 3rd wild → 3 wilds, 1 hippie → net = 3-1 = 2 < 3 → no blame
    const state = {
      ...base,
      house: [
        { id: "h1", type: "hippie", abilityUsed: false, order: 0 },
        { id: "w1", type: "wildBuddy", abilityUsed: false, order: 1 },
        { id: "w2", type: "wildBuddy", abilityUsed: false, order: 2 },
      ],
      rolodex: [{ id: "w3", type: "wildBuddy", abilityUsed: false, order: 3 }],
      houseCapacity: 5,
    };
    const result = addGuestToParty(state, "w3");
    expect(result.trouble).toBe(2);
    expect(result.phase).toBe("party");
  });

  it("hippie does not prevent blame when trouble reaches threshold + hippieCount", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    // 3 wilds + hippie → net = 3-1 = 2; adding 4th wild → net = 4-1 = 3 → blame
    const state = {
      ...base,
      house: [
        { id: "h1", type: "hippie", abilityUsed: false, order: 0 },
        { id: "w1", type: "wildBuddy", abilityUsed: false, order: 1 },
        { id: "w2", type: "wildBuddy", abilityUsed: false, order: 2 },
        { id: "w3", type: "wildBuddy", abilityUsed: false, order: 3 },
      ],
      rolodex: [{ id: "w4", type: "wildBuddy", abilityUsed: false, order: 4 }],
      houseCapacity: 6,
    };
    const result = addGuestToParty(state, "w4");
    expect(result.trouble).toBe(3);
    expect(result.phase).toBe("blame");
  });

  it("hippie filling last house slot auto-ends the party", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const hippie = { id: "h1", type: "hippie", abilityUsed: false, order: 0 };
    const state = {
      ...base,
      house: [{ id: "o1", type: "oldFriend", abilityUsed: false, order: 1 }],
      rolodex: [hippie],
      houseCapacity: 2,
      trouble: 0,
      bannedThisParty: [],
    };
    const result = addGuestToParty(state, "h1");
    expect(result.phase).toBe("summary");
  });

  it("transitions to won phase when 4th alien enters the house", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const aliens = [
      { id: "a1", type: "alien", abilityUsed: false, order: 0 },
      { id: "a2", type: "alien", abilityUsed: false, order: 1 },
      { id: "a3", type: "alien", abilityUsed: false, order: 2 },
      { id: "a4", type: "alien", abilityUsed: false, order: 3 },
    ];
    const state = {
      ...base,
      house: aliens.slice(0, 3),
      rolodex: [aliens[3]],
      houseCapacity: 10,
    };
    const result = addGuestToParty(state, "a4");
    expect(result.phase).toBe("won");
    expect(result.house).toHaveLength(4);
  });

  it("4th alien via autoInvite also triggers won", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const aliens = [
      { id: "a1", type: "alien", abilityUsed: false, order: 0 },
      { id: "a2", type: "alien", abilityUsed: false, order: 1 },
      { id: "a3", type: "alien", abilityUsed: false, order: 2 },
      { id: "a4", type: "alien", abilityUsed: false, order: 3 },
    ];
    const mrPop = {
      id: "mp1",
      type: "mrPopular",
      abilityUsed: false,
      order: 4,
    };
    const state = {
      ...base,
      house: aliens.slice(0, 3),
      rolodex: [mrPop, aliens[3]],
      houseCapacity: 10,
      bannedThisParty: [],
    };
    const result = addGuestToParty(state, "mp1");
    expect(result.phase).toBe("won");
  });

  it("does NOT auto-end when house full but a guest has an unused ability", () => {
    const idGen = makeIdGen();
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const driver = { id: idGen(), type: "driver", abilityUsed: false };
    const s = {
      ...base,
      houseCapacity: 2,
      house: [{ id: "h1", type: "oldFriend", abilityUsed: false }],
      rolodex: [driver],
    };
    const next = addGuestToParty(s, driver.id);
    expect(next.phase).toBe("party");
  });

  it("does nothing if guest id is not in rolodex", () => {
    const next = addGuestToParty(state, "not-a-real-id");
    expect(next).toBe(state);
  });

  it("climber increments its own climberCount on arrival", () => {
    const idGen = makeIdGen();
    const climber = {
      id: idGen(),
      type: "climber",
      abilityUsed: false,
      order: 0,
    };
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      rolodex: [climber],
    };
    const next = addGuestToParty(s, climber.id);
    expect(next.house[0].climberCount).toBe(1);
  });

  it("climber individual count does not exceed 9", () => {
    const idGen = makeIdGen();
    const climber = {
      id: idGen(),
      type: "climber",
      abilityUsed: false,
      order: 0,
      climberCount: 9,
    };
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      rolodex: [climber],
    };
    const next = addGuestToParty(s, climber.id);
    expect(next.house[0].climberCount).toBe(9);
  });

  it("cuteDog raises trouble threshold like hippie", () => {
    // 2 wilds + cuteDog → net = 2-1 = 1; adding 3rd wild → net = 3-1 = 2 < 3 → no blame
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      house: [
        { id: "cd", type: "cuteDog", abilityUsed: false, order: 0 },
        { id: "w1", type: "wildBuddy", abilityUsed: false, order: 1 },
        { id: "w2", type: "wildBuddy", abilityUsed: false, order: 2 },
      ],
      rolodex: [{ id: "w3", type: "wildBuddy", abilityUsed: false, order: 3 }],
      houseCapacity: 5,
    };
    const result = addGuestToParty(s, "w3");
    expect(result.trouble).toBe(2);
    expect(result.phase).toBe("party");
  });

  it("hippie and cuteDog together raise threshold by 2", () => {
    // 3 wilds + hippie + cuteDog → net = 3-2 = 1; adding 4th wild → net = 4-2 = 2 < 3 → no blame
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      house: [
        { id: "h1", type: "hippie", abilityUsed: false, order: 0 },
        { id: "cd", type: "cuteDog", abilityUsed: false, order: 1 },
        { id: "w1", type: "wildBuddy", abilityUsed: false, order: 2 },
        { id: "w2", type: "wildBuddy", abilityUsed: false, order: 3 },
        { id: "w3", type: "wildBuddy", abilityUsed: false, order: 4 },
      ],
      rolodex: [{ id: "w4", type: "wildBuddy", abilityUsed: false, order: 5 }],
      houseCapacity: 7,
    };
    // 4 wilds, 2 white flags → net = 4-2 = 2 < 3 → party
    const result = addGuestToParty(s, "w4");
    expect(result.trouble).toBe(2);
    expect(result.phase).toBe("party");
  });
});

describe("endParty", () => {
  it("transitions to summary phase", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    expect(endParty(base).phase).toBe("summary");
  });
});

describe("confirmSummary", () => {
  it("scores guests, applies caps, decrements nightsLeft, enters shop", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const house = [
      { id: "a", type: "oldFriend", abilityUsed: false },
      { id: "b", type: "richPal", abilityUsed: false },
    ];
    const state = { ...base, house, popularity: 0, cash: 0, phase: "summary" };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(1);
    expect(next.cash).toBe(1);
    expect(next.nightsLeft).toBe(23);
    expect(next.phase).toBe("shop");
  });

  it("caps popularity at 60 and cash at 30", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const house = [{ id: "a", type: "caterer", abilityUsed: false }];
    const state = {
      ...base,
      house,
      popularity: 58,
      cash: 30,
      phase: "summary",
    };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(60);
    expect(next.cash).toBe(29);
  });

  it("floors cash and popularity at 0", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const house = [{ id: "a", type: "caterer", abilityUsed: false }];
    const state = { ...base, house, popularity: 0, cash: 0, phase: "summary" };
    const next = confirmSummary(state);
    expect(next.cash).toBe(0);
  });

  it("dancers score (count)^2 and ignore individual popBonus", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const house = [
      { id: "a", type: "dancer", abilityUsed: false },
      { id: "b", type: "dancer", abilityUsed: false },
      { id: "c", type: "dancer", abilityUsed: false },
    ];
    const state = { ...base, house, phase: "summary" };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(9);
  });

  it("comedians add +5 pop each when house is full", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const house = [
      { id: "a", type: "comedian", abilityUsed: false },
      { id: "b", type: "comedian", abilityUsed: false },
    ];
    const state = { ...base, house, houseCapacity: 2, phase: "summary" };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(10);
    expect(next.cash).toBe(0);
  });

  it("comedians do not give bonus if house not full", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const house = [{ id: "a", type: "comedian", abilityUsed: false }];
    const state = { ...base, house, houseCapacity: 5, phase: "summary" };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(0);
  });

  it("regenerates testShop in test mode", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      mode: "test",
    });
    const state = { ...base, house: [], phase: "summary" };
    const next = confirmSummary(state);
    expect(next.testShop).not.toBeNull();
    expect(next.testShop.length).toBe(9);
  });

  it("keeps testShop null in classic mode", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, house: [], phase: "summary" };
    const next = confirmSummary(state);
    expect(next.testShop).toBeNull();
  });

  it("sets phase to gameOver when nightsLeft reaches 0", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, house: [], phase: "summary", nightsLeft: 1 };
    const next = confirmSummary(state);
    expect(next.nightsLeft).toBe(0);
    expect(next.phase).toBe("gameOver");
  });
});

describe("scoreHouse", () => {
  it("returns {pop, cash} totals", () => {
    const house = [
      { id: "a", type: "oldFriend", abilityUsed: false },
      { id: "b", type: "richPal", abilityUsed: false },
    ];
    expect(scoreHouse(house, 10)).toEqual({ pop: 1, cash: 1 });
  });

  it("introvert scores +1 pop per empty tile on top of base popBonus", () => {
    // 1 introvert in a capacity-5 house = 4 empty tiles → 1 (base) + 4 = 5 pop
    const house = [{ id: "i1", type: "introvert", abilityUsed: false }];
    expect(scoreHouse(house, 5).pop).toBe(5);
  });

  it("two introverts each add empty-tile bonus", () => {
    // 2 introverts, capacity 5, 3 empty → each gets +3: (1+3)*2 = 8 pop
    const house = [
      { id: "i1", type: "introvert", abilityUsed: false },
      { id: "i2", type: "introvert", abilityUsed: false },
    ];
    expect(scoreHouse(house, 5).pop).toBe(8);
  });

  it("mascot scores +1 pop per oldFriend in house", () => {
    // 1 mascot + 2 oldFriends → mascot: 1(base)+2(bonus)=3, oldFriends: 2*1=2 → total 5
    const house = [
      { id: "m1", type: "mascot", abilityUsed: false },
      { id: "o1", type: "oldFriend", abilityUsed: false },
      { id: "o2", type: "oldFriend", abilityUsed: false },
    ];
    expect(scoreHouse(house, 10).pop).toBe(5);
  });

  it("mascot scores 0 bonus when no oldFriends present", () => {
    const house = [{ id: "m1", type: "mascot", abilityUsed: false }];
    expect(scoreHouse(house, 10).pop).toBe(1);
  });

  it("writer scores +2 pop per trouble guest in house", () => {
    // 1 writer + 1 wildBuddy (trouble) → writer: 1+2=3, wildBuddy: 2 → total 5
    const house = [
      { id: "w1", type: "writer", abilityUsed: false },
      { id: "wb1", type: "wildBuddy", abilityUsed: false },
    ];
    expect(scoreHouse(house, 10).pop).toBe(5);
  });

  it("writer counts all trouble guests including scenario 2", () => {
    // 1 writer + 1 gangster (trouble) + 1 gambler (trouble) → 1+4=5 pop for writer, 0+2=2 for gangster, 2+3=5 cash/pop for gambler
    const house = [
      { id: "w1", type: "writer", abilityUsed: false },
      { id: "g1", type: "gangster", abilityUsed: false },
      { id: "gm1", type: "gambler", abilityUsed: false },
    ];
    expect(scoreHouse(house, 10).pop).toBe(1 + 4 + 0 + 2); // writer(1+4)+gangster(0)+gambler(2)
  });

  it("climber contributes its climberCount to pop", () => {
    const house = [
      { id: "o1", type: "oldFriend", abilityUsed: false },
      { id: "c1", type: "climber", abilityUsed: false, climberCount: 3 },
    ];
    expect(scoreHouse(house, 10).pop).toBe(4); // 1 (oldFriend) + 3 (climber)
  });

  it("climber with no climberCount contributes 0 pop", () => {
    const house = [{ id: "c1", type: "climber", abilityUsed: false }];
    expect(scoreHouse(house, 10).pop).toBe(0);
  });
});

describe("blameGuest", () => {
  it("bans guest, removes from house, no scoring, goes to shop", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const house = [
      { id: "a", type: "wildBuddy", abilityUsed: false },
      { id: "b", type: "wildBuddy", abilityUsed: false },
    ];
    const state = {
      ...base,
      house,
      trouble: 3,
      phase: "blame",
      blameContext: "trouble",
      cash: 5,
      popularity: 5,
      bannedThisParty: ["old-ban"],
    };
    const next = blameGuest(state, "a");
    expect(next.house.map((g) => g.id)).toEqual(["b"]);
    expect(next.bannedThisParty).toEqual(["old-ban", "a"]);
    expect(next.phase).toBe("shop");
    expect(next.cash).toBe(5);
    expect(next.popularity).toBe(5);
    expect(next.nightsLeft).toBe(base.nightsLeft - 1);
  });

  it("regenerates testShop in test mode", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      mode: "test",
    });
    const house = [{ id: "a", type: "wildBuddy", abilityUsed: false }];
    const state = {
      ...base,
      house,
      trouble: 3,
      phase: "blame",
      blameContext: "trouble",
    };
    const next = blameGuest(state, "a");
    expect(next.testShop).not.toBeNull();
    expect(next.testShop.length).toBe(9);
  });

  it("keeps testShop null in classic mode", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const house = [{ id: "a", type: "wildBuddy", abilityUsed: false }];
    const state = {
      ...base,
      house,
      trouble: 3,
      phase: "blame",
      blameContext: "trouble",
    };
    const next = blameGuest(state, "a");
    expect(next.testShop).toBeNull();
  });

  it("sets phase to gameOver when nightsLeft reaches 0", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const house = [{ id: "a", type: "wildBuddy", abilityUsed: false }];
    const state = {
      ...base,
      house,
      trouble: 3,
      phase: "blame",
      blameContext: "trouble",
      nightsLeft: 1,
    };
    const next = blameGuest(state, "a");
    expect(next.nightsLeft).toBe(0);
    expect(next.phase).toBe("gameOver");
  });
});

describe("driverPickGuest", () => {
  it("invites any chosen rolodex guest", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const driver = { id: "d1", type: "driver", abilityUsed: true };
    const target = {
      id: "g1",
      type: "oldFriend",
      abilityUsed: false,
      order: 0,
    };
    const other = { id: "g2", type: "richPal", abilityUsed: false, order: 1 };
    const state = {
      ...base,
      house: [driver],
      rolodex: [other, target],
      bannedThisParty: [],
      driverMode: { driverId: "d1" },
      houseCapacity: 5,
    };
    const result = driverPickGuest(state, "g1");
    expect(result.house.map((g) => g.id)).toContain("g1");
    expect(result.rolodex.map((g) => g.id)).not.toContain("g1");
    expect(result.driverMode).toBeNull();
  });

  it("ignores banned guests", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = {
      ...base,
      driverMode: { driverId: "d1" },
      bannedThisParty: ["b1"],
    };
    const result = driverPickGuest(state, "b1");
    expect(result).toBe(state);
  });
});

describe("purchaseGuest", () => {
  it("deducts popularity and appends guest to rolodex", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, popularity: 10, rolodex: [] };
    const next = purchaseGuest(state, "oldFriend", { idGen: () => "p1" });
    expect(next.popularity).toBe(10 - GUEST_TYPES.oldFriend.shopCost);
    expect(next.rolodex[0]).toMatchObject({
      id: "p1",
      type: "oldFriend",
      abilityUsed: false,
    });
    expect(typeof next.rolodex[0].order).toBe("number");
    expect(next.purchasedCounts.oldFriend).toBe(1);
  });

  it("refuses purchase if not enough popularity", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, popularity: 0 };
    const next = purchaseGuest(state, "oldFriend");
    expect(next).toBe(state);
  });

  it("refuses purchase at maxPurchase", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = {
      ...base,
      popularity: 100,
      purchasedCounts: { oldFriend: 4 },
    };
    const next = purchaseGuest(state, "oldFriend");
    expect(next).toBe(state);
  });

  it("allows unlimited alien purchases", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = {
      ...base,
      popularity: 500,
      purchasedCounts: { alien: 50 },
    };
    const next = purchaseGuest(state, "alien", { idGen: () => "a" });
    expect(next.purchasedCounts.alien).toBe(51);
  });

  it("refuses a scenario 2 guest when in scenario 1", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      scenario: "s1",
    });
    const state = { ...base, popularity: 100 };
    const next = purchaseGuest(state, "privateEye");
    expect(next).toBe(state);
  });

  it("allows a scenario 2 guest when in scenario 2", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      scenario: "s2",
    });
    const state = { ...base, popularity: 100 };
    const next = purchaseGuest(state, "privateEye", { idGen: () => "p1" });
    expect(next.popularity).toBeLessThan(100);
    expect(next.rolodex.some((g) => g.type === "privateEye")).toBe(true);
  });

  it("refuses a scenario 1 guest when in scenario 2", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      scenario: "s2",
    });
    const state = { ...base, popularity: 100 };
    const next = purchaseGuest(state, "alien");
    expect(next).toBe(state);
  });

  it("refuses a guest type that has no shopCost", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, popularity: 100 };
    const next = purchaseGuest(state, "wildBuddy");
    expect(next).toBe(state);
  });

  it("uses crypto.randomUUID as default id generator", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid" });
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, popularity: 10, rolodex: [] };
    const next = purchaseGuest(state, "oldFriend");
    expect(next.rolodex[0].id).toBe("uuid");
  });
});

describe("expandHouse", () => {
  it("deducts cash, increments capacity and houseCostIndex", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, cash: 10, houseCapacity: 5, houseCostIndex: 0 };
    const next = expandHouse(state);
    expect(next.cash).toBe(8);
    expect(next.houseCapacity).toBe(6);
    expect(next.houseCostIndex).toBe(1);
  });

  it("refuses if not enough cash", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, cash: 1, houseCostIndex: 0 };
    expect(expandHouse(state)).toBe(state);
  });

  it("refuses when at max capacity (34)", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, cash: 30, houseCapacity: 34, houseCostIndex: 20 };
    expect(expandHouse(state)).toBe(state);
  });
});

describe("startNextParty", () => {
  it("resets trouble, ability flags, clears bannedThisParty, phase=party", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const guardUsed = { id: "g1", type: "securityGuard", abilityUsed: true };
    const state = {
      ...base,
      trouble: 2,
      phase: "shop",
      rolodex: [guardUsed],
      bannedThisParty: ["banned-id"],
    };
    const next = startNextParty(state, (a) => a);
    expect(next.trouble).toBe(0);
    expect(next.phase).toBe("party");
    expect(next.rolodex[0].abilityUsed).toBe(false);
    expect(next.bannedThisParty).toEqual([]);
  });

  it("shuffles the rolodex using the provided shuffleFn", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const state = { ...base, phase: "shop" };
    const reversed = (a) => [...a].reverse();
    const next = startNextParty(state, reversed);
    expect(next.rolodex.map((g) => g.id)).toEqual(
      [...state.rolodex].reverse().map((g) => g.id),
    );
  });
});

describe("countStars", () => {
  it("counts guests with stars", () => {
    const house = [
      { id: "a", type: "alien", abilityUsed: false },
      { id: "b", type: "oldFriend", abilityUsed: false },
      { id: "c", type: "alien", abilityUsed: false },
    ];
    expect(countStars(house)).toBe(2);
  });
});

describe("addGuestToParty — scenario 2 star win condition", () => {
  it("transitions to won phase when 4th mermaid enters the house", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      scenario: "s2",
    });
    const mermaids = [
      { id: "m1", type: "mermaid", abilityUsed: false },
      { id: "m2", type: "mermaid", abilityUsed: false },
      { id: "m3", type: "mermaid", abilityUsed: false },
    ];
    const m4 = { id: "m4", type: "mermaid", abilityUsed: false };
    const state = {
      ...base,
      house: mermaids,
      rolodex: [m4],
      bannedThisParty: [],
      houseCapacity: 10,
    };
    const result = addGuestToParty(state, "m4");
    expect(result.phase).toBe("won");
    expect(result.house).toHaveLength(4);
  });

  it("transitions to won phase when 4th superhero enters the house", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
      scenario: "s2",
    });
    const heroes = [
      { id: "h1", type: "superhero", abilityUsed: false },
      { id: "h2", type: "superhero", abilityUsed: false },
      { id: "h3", type: "superhero", abilityUsed: false },
    ];
    const h4 = { id: "h4", type: "superhero", abilityUsed: false };
    const state = {
      ...base,
      house: heroes,
      rolodex: [h4],
      bannedThisParty: [],
      houseCapacity: 10,
    };
    const result = addGuestToParty(state, "h4");
    expect(result.phase).toBe("won");
  });
});
