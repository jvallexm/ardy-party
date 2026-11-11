import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialState,
  addGuestToParty,
  endParty,
  confirmSummary,
  blameGuest,
  activateAbility,
  kickGuest,
  confirmDogReveal,
  purchaseGuest,
  expandHouse,
  startNextParty,
  countStars,
  scoreHouse,
} from './gameState.js';
import { GUEST_TYPES } from './guests.js';

// Deterministic id generator for tests
function makeIdGen() {
  let i = 0;
  return () => `id-${++i}`;
}

function makeGuest(type, id = 'g1', abilityUsed = false) {
  return { id, type, abilityUsed };
}

describe('createInitialState', () => {
  it('populates rolodex with starting guests using provided id generator', () => {
    const state = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    expect(state.nightsLeft).toBe(24);
    expect(state.cash).toBe(0);
    expect(state.popularity).toBe(0);
    expect(state.trouble).toBe(0);
    expect(state.house).toEqual([]);
    expect(state.houseCapacity).toBe(5);
    expect(state.phase).toBe('party');
    expect(state.bannedThisParty).toEqual([]);
    expect(state.rolodex.length).toBe(10);
    const counts = state.rolodex.reduce((m, g) => {
      m[g.type] = (m[g.type] || 0) + 1;
      return m;
    }, {});
    expect(counts).toEqual({ oldFriend: 4, richPal: 2, wildBuddy: 4 });
    state.rolodex.forEach((g, i) => expect(g.id).toBe(`id-${i + 1}`));
  });

  it('defaults to crypto.randomUUID when no idGen is provided', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-x' });
    const state = createInitialState();
    expect(state.rolodex.every((g) => g.id === 'uuid-x')).toBe(true);
  });

  it('starts with empty purchasedCounts and houseCostIndex 0', () => {
    const state = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    expect(state.purchasedCounts).toEqual({});
    expect(state.houseCostIndex).toBe(0);
    expect(state.dogRevealGuestId).toBeNull();
    expect(state.blameContext).toBeNull();
  });
});

describe('addGuestToParty', () => {
  let state;
  beforeEach(() => {
    state = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
  });

  it('moves a guest from rolodex to house', () => {
    const guestId = state.rolodex[0].id;
    const next = addGuestToParty(state, guestId);
    expect(next.house).toHaveLength(1);
    expect(next.house[0].id).toBe(guestId);
    expect(next.rolodex.find((g) => g.id === guestId)).toBeUndefined();
  });

  it('increments trouble when a trouble guest enters', () => {
    const wild = state.rolodex.find((g) => g.type === 'wildBuddy');
    const next = addGuestToParty(state, wild.id);
    expect(next.trouble).toBe(1);
  });

  it('does not increment trouble for non-trouble guests', () => {
    const friend = state.rolodex.find((g) => g.type === 'oldFriend');
    const next = addGuestToParty(state, friend.id);
    expect(next.trouble).toBe(0);
  });

  it('enters blame phase when trouble hits 3', () => {
    let s = state;
    const wilds = s.rolodex.filter((g) => g.type === 'wildBuddy');
    s = addGuestToParty(s, wilds[0].id);
    s = addGuestToParty(s, wilds[1].id);
    s = addGuestToParty(s, wilds[2].id);
    expect(s.trouble).toBe(3);
    expect(s.phase).toBe('blame');
    expect(s.blameContext).toBe('trouble');
  });

  it('auto-invites next unbanned rolodex guest when mrPopular enters', () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: 'mrPopular', abilityUsed: false };
    const friend = { id: idGen(), type: 'oldFriend', abilityUsed: false };
    const alsoFriend = { id: idGen(), type: 'oldFriend', abilityUsed: false };
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      rolodex: [mrPop, friend, alsoFriend],
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.house.map((g) => g.id)).toEqual([mrPop.id, friend.id]);
    expect(next.phase).toBe('party');
  });

  it('skips banned guests when mrPopular auto-invites', () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: 'mrPopular', abilityUsed: false };
    const banned = { id: idGen(), type: 'oldFriend', abilityUsed: false };
    const unbanned = { id: idGen(), type: 'oldFriend', abilityUsed: false };
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const s = {
      ...base,
      rolodex: [mrPop, banned, unbanned],
      bannedThisParty: [banned.id],
      houseCapacity: 5,
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.house.map((g) => g.id)).toEqual([mrPop.id, unbanned.id]);
  });

  it('skips auto-invite when there are no more rolodex guests', () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: 'mrPopular', abilityUsed: false };
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      rolodex: [mrPop],
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.house.map((g) => g.id)).toEqual([mrPop.id]);
    expect(next.phase).toBe('party');
  });

  it('enters blame phase when mrPopular auto-invites a trouble guest that pushes to 3', () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: 'mrPopular', abilityUsed: false };
    const wild = { id: idGen(), type: 'wildBuddy', abilityUsed: false };
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const s = {
      ...base,
      houseCapacity: 5,
      house: [],
      rolodex: [mrPop, wild],
      trouble: 2,
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.trouble).toBe(3);
    expect(next.phase).toBe('blame');
    expect(next.blameContext).toBe('trouble');
  });

  it('enters blame phase (overcapacity) when mrPopular auto-invite exceeds capacity', () => {
    const idGen = makeIdGen();
    const mrPop = { id: idGen(), type: 'mrPopular', abilityUsed: false };
    const other = { id: idGen(), type: 'oldFriend', abilityUsed: false };
    const s = {
      ...createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a }),
      houseCapacity: 1,
      house: [],
      rolodex: [mrPop, other],
    };
    const next = addGuestToParty(s, mrPop.id);
    expect(next.phase).toBe('blame');
    expect(next.blameContext).toBe('overcapacity');
    expect(next.house).toHaveLength(2);
  });

  it('auto-ends party when house full and no abilities remain', () => {
    const idGen = makeIdGen();
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const last = { id: idGen(), type: 'oldFriend', abilityUsed: false };
    const s = {
      ...base,
      houseCapacity: 2,
      house: [{ id: 'h1', type: 'oldFriend', abilityUsed: false }],
      rolodex: [last],
    };
    const next = addGuestToParty(s, last.id);
    expect(next.phase).toBe('summary');
  });

  it('auto-ends when house full with only comedians (fullHouseBonus is passive)', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const comedian = { id: 'c', type: 'comedian', abilityUsed: false };
    const incoming = { id: 'c2', type: 'comedian', abilityUsed: false };
    const s = {
      ...base,
      houseCapacity: 2,
      house: [comedian],
      rolodex: [incoming],
    };
    const next = addGuestToParty(s, incoming.id);
    expect(next.phase).toBe('summary');
  });

  it('does NOT auto-end when house full but a guest has an unused ability', () => {
    const idGen = makeIdGen();
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const driver = { id: idGen(), type: 'driver', abilityUsed: false };
    const s = {
      ...base,
      houseCapacity: 2,
      house: [{ id: 'h1', type: 'oldFriend', abilityUsed: false }],
      rolodex: [driver],
    };
    const next = addGuestToParty(s, driver.id);
    expect(next.phase).toBe('party');
  });

  it('does nothing if guest id is not in rolodex', () => {
    const next = addGuestToParty(state, 'not-a-real-id');
    expect(next).toBe(state);
  });
});

describe('endParty', () => {
  it('transitions to summary phase', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    expect(endParty(base).phase).toBe('summary');
  });
});

describe('confirmSummary', () => {
  it('scores guests, applies caps, decrements nightsLeft, enters shop', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const house = [
      { id: 'a', type: 'oldFriend', abilityUsed: false },
      { id: 'b', type: 'richPal', abilityUsed: false },
    ];
    const state = { ...base, house, popularity: 0, cash: 0, phase: 'summary' };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(1);
    expect(next.cash).toBe(1);
    expect(next.nightsLeft).toBe(23);
    expect(next.phase).toBe('shop');
  });

  it('caps popularity at 60 and cash at 30', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const house = [{ id: 'a', type: 'caterer', abilityUsed: false }];
    const state = { ...base, house, popularity: 58, cash: 30, phase: 'summary' };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(60);
    expect(next.cash).toBe(29);
  });

  it('floors cash and popularity at 0', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const house = [{ id: 'a', type: 'caterer', abilityUsed: false }];
    const state = { ...base, house, popularity: 0, cash: 0, phase: 'summary' };
    const next = confirmSummary(state);
    expect(next.cash).toBe(0);
  });

  it('dancers score (count)^2 and ignore individual popBonus', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const house = [
      { id: 'a', type: 'dancer', abilityUsed: false },
      { id: 'b', type: 'dancer', abilityUsed: false },
      { id: 'c', type: 'dancer', abilityUsed: false },
    ];
    const state = { ...base, house, phase: 'summary' };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(9);
  });

  it('comedians add +5 pop each when house is full', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const house = [
      { id: 'a', type: 'comedian', abilityUsed: false },
      { id: 'b', type: 'comedian', abilityUsed: false },
    ];
    const state = { ...base, house, houseCapacity: 2, phase: 'summary' };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(10);
    expect(next.cash).toBe(0);
  });

  it('comedians do not give bonus if house not full', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const house = [{ id: 'a', type: 'comedian', abilityUsed: false }];
    const state = { ...base, house, houseCapacity: 5, phase: 'summary' };
    const next = confirmSummary(state);
    expect(next.popularity).toBe(0);
  });
});

describe('scoreHouse', () => {
  it('returns {pop, cash} totals', () => {
    const house = [
      { id: 'a', type: 'oldFriend', abilityUsed: false },
      { id: 'b', type: 'richPal', abilityUsed: false },
    ];
    expect(scoreHouse(house, 10)).toEqual({ pop: 1, cash: 1 });
  });
});

describe('blameGuest', () => {
  it('bans guest, removes from house, no scoring, goes to shop', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const house = [
      { id: 'a', type: 'wildBuddy', abilityUsed: false },
      { id: 'b', type: 'wildBuddy', abilityUsed: false },
    ];
    const state = {
      ...base,
      house,
      trouble: 3,
      phase: 'blame',
      blameContext: 'trouble',
      cash: 5,
      popularity: 5,
      bannedThisParty: ['old-ban'],
    };
    const next = blameGuest(state, 'a');
    expect(next.house.map((g) => g.id)).toEqual(['b']);
    expect(next.bannedThisParty).toEqual(['a']);
    expect(next.phase).toBe('shop');
    expect(next.cash).toBe(5);
    expect(next.popularity).toBe(5);
    expect(next.nightsLeft).toBe(base.nightsLeft - 1);
  });
});

describe('activateAbility', () => {
  it('driver adds next unbanned rolodex guest to house and marks ability used', () => {
    const idGen = makeIdGen();
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const driver = { id: idGen(), type: 'driver', abilityUsed: false };
    const next1 = { id: idGen(), type: 'oldFriend', abilityUsed: false };
    const state = {
      ...base,
      house: [driver],
      rolodex: [next1],
      bannedThisParty: [],
    };
    const result = activateAbility(state, driver.id);
    expect(result.house).toHaveLength(2);
    expect(result.house[1].id).toBe(next1.id);
    expect(result.house[0].abilityUsed).toBe(true);
    expect(result.rolodex).toHaveLength(0);
  });

  it('driver does nothing special when rolodex empty but still marks used', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const driver = { id: 'd1', type: 'driver', abilityUsed: false };
    const state = { ...base, house: [driver], rolodex: [] };
    const result = activateAbility(state, driver.id);
    expect(result.house[0].abilityUsed).toBe(true);
    expect(result.house).toHaveLength(1);
  });

  it('driver skips banned guests', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const driver = { id: 'd1', type: 'driver', abilityUsed: false };
    const banned = { id: 'b1', type: 'oldFriend', abilityUsed: false };
    const good = { id: 'g1', type: 'oldFriend', abilityUsed: false };
    const state = {
      ...base,
      house: [driver],
      rolodex: [banned, good],
      bannedThisParty: ['b1'],
    };
    const result = activateAbility(state, driver.id);
    expect(result.house[1].id).toBe('g1');
    expect(result.rolodex.map((g) => g.id)).toEqual(['b1']);
  });

  it('hippie reduces trouble and marks ability used', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const hippie = { id: 'h1', type: 'hippie', abilityUsed: false };
    const state = { ...base, house: [hippie], trouble: 2 };
    const result = activateAbility(state, hippie.id);
    expect(result.trouble).toBe(1);
    expect(result.house[0].abilityUsed).toBe(true);
  });

  it('hippie trouble floors at 0', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const hippie = { id: 'h1', type: 'hippie', abilityUsed: false };
    const state = { ...base, house: [hippie], trouble: 0 };
    const result = activateAbility(state, hippie.id);
    expect(result.trouble).toBe(0);
  });

  it('dog sets dogRevealGuestId to next rolodex id and phase', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const dog = { id: 'd1', type: 'dog', abilityUsed: false };
    const next = { id: 'n1', type: 'oldFriend', abilityUsed: false };
    const state = { ...base, house: [dog], rolodex: [next] };
    const result = activateAbility(state, dog.id);
    expect(result.dogRevealGuestId).toBe('n1');
    expect(result.phase).toBe('dogReveal');
    expect(result.house[0].abilityUsed).toBe(true);
  });

  it('dog does nothing when rolodex is empty', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const dog = { id: 'd1', type: 'dog', abilityUsed: false };
    const state = { ...base, house: [dog], rolodex: [] };
    const result = activateAbility(state, dog.id);
    expect(result).toBe(state);
  });

  it('dog skips banned guests when revealing', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const dog = { id: 'd1', type: 'dog', abilityUsed: false };
    const banned = { id: 'b', type: 'oldFriend', abilityUsed: false };
    const next = { id: 'n', type: 'oldFriend', abilityUsed: false };
    const state = {
      ...base,
      house: [dog],
      rolodex: [banned, next],
      bannedThisParty: ['b'],
    };
    const result = activateAbility(state, dog.id);
    expect(result.dogRevealGuestId).toBe('n');
  });

  it('securityGuard returns kickMode', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const guard = { id: 'g1', type: 'securityGuard', abilityUsed: false };
    const state = { ...base, house: [guard] };
    const result = activateAbility(state, guard.id);
    expect(result.kickMode).toEqual({ kickerId: 'g1' });
  });

  it('is a no-op if the guest has no ability', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const friend = { id: 'f1', type: 'oldFriend', abilityUsed: false };
    const state = { ...base, house: [friend] };
    expect(activateAbility(state, friend.id)).toBe(state);
  });

  it('is a no-op if guest not found', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    expect(activateAbility(base, 'nope')).toBe(base);
  });

  it('is a no-op for comedian (fullHouseBonus is passive)', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const com = { id: 'c1', type: 'comedian', abilityUsed: false };
    const state = { ...base, house: [com] };
    const result = activateAbility(state, com.id);
    expect(result).toBe(state);
  });

  it('is a no-op if ability already used', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const driver = { id: 'd', type: 'driver', abilityUsed: true };
    const state = { ...base, house: [driver] };
    expect(activateAbility(state, driver.id)).toBe(state);
  });
});

describe('kickGuest', () => {
  it('kicks target out and marks kicker ability used, clears kickMode', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const guard = { id: 'g1', type: 'securityGuard', abilityUsed: false };
    const target = { id: 't1', type: 'wildBuddy', abilityUsed: false };
    const state = {
      ...base,
      house: [guard, target],
      kickMode: { kickerId: 'g1' },
      trouble: 1,
    };
    const result = kickGuest(state, 'g1', 't1');
    expect(result.house.map((g) => g.id)).toEqual(['g1']);
    expect(result.house[0].abilityUsed).toBe(true);
    expect(result.bannedThisParty).toContain('t1');
    expect(result.kickMode).toBeUndefined();
  });

  it('reduces trouble when kicking a trouble guest', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const guard = { id: 'g1', type: 'securityGuard', abilityUsed: false };
    const target = { id: 't1', type: 'wildBuddy', abilityUsed: false };
    const state = {
      ...base,
      house: [guard, target],
      kickMode: { kickerId: 'g1' },
      trouble: 2,
    };
    const result = kickGuest(state, 'g1', 't1');
    expect(result.trouble).toBe(1);
  });

  it('does not change trouble when kicking a non-trouble guest', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const guard = { id: 'g1', type: 'securityGuard', abilityUsed: false };
    const target = { id: 't1', type: 'oldFriend', abilityUsed: false };
    const state = {
      ...base,
      house: [guard, target],
      kickMode: { kickerId: 'g1' },
      trouble: 2,
    };
    const result = kickGuest(state, 'g1', 't1');
    expect(result.trouble).toBe(2);
  });
});

describe('confirmDogReveal', () => {
  it('boots the revealed guest from rolodex and resets state', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const dog = { id: 'd1', type: 'dog', abilityUsed: true };
    const booted = { id: 'r1', type: 'wildBuddy', abilityUsed: false };
    const state = {
      ...base,
      house: [dog],
      rolodex: [booted],
      dogRevealGuestId: 'r1',
      phase: 'dogReveal',
    };
    const result = confirmDogReveal(state, 'boot');
    expect(result.rolodex.find((g) => g.id === 'r1')).toBeUndefined();
    expect(result.dogRevealGuestId).toBeNull();
    expect(result.phase).toBe('party');
  });

  it('keep leaves rolodex intact', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const dog = { id: 'd1', type: 'dog', abilityUsed: true };
    const kept = { id: 'r1', type: 'wildBuddy', abilityUsed: false };
    const state = {
      ...base,
      house: [dog],
      rolodex: [kept],
      dogRevealGuestId: 'r1',
      phase: 'dogReveal',
    };
    const result = confirmDogReveal(state, 'keep');
    expect(result.rolodex.map((g) => g.id)).toEqual(['r1']);
    expect(result.dogRevealGuestId).toBeNull();
    expect(result.phase).toBe('party');
  });
});

describe('purchaseGuest', () => {
  it('deducts popularity and appends guest to rolodex', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = { ...base, popularity: 10, rolodex: [] };
    const next = purchaseGuest(state, 'oldFriend', { idGen: () => 'p1' });
    expect(next.popularity).toBe(10 - GUEST_TYPES.oldFriend.shopCost);
    expect(next.rolodex[0]).toMatchObject({ id: 'p1', type: 'oldFriend', abilityUsed: false });
    expect(typeof next.rolodex[0].order).toBe('number');
    expect(next.purchasedCounts.oldFriend).toBe(1);
  });

  it('refuses purchase if not enough popularity', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = { ...base, popularity: 0 };
    const next = purchaseGuest(state, 'oldFriend');
    expect(next).toBe(state);
  });

  it('refuses purchase at maxPurchase', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = {
      ...base,
      popularity: 100,
      purchasedCounts: { oldFriend: 4 },
    };
    const next = purchaseGuest(state, 'oldFriend');
    expect(next).toBe(state);
  });

  it('allows unlimited alien purchases', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = {
      ...base,
      popularity: 500,
      purchasedCounts: { alien: 50 },
    };
    const next = purchaseGuest(state, 'alien', { idGen: () => 'a' });
    expect(next.purchasedCounts.alien).toBe(51);
  });

  it('refuses a guest type that has no shopCost', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = { ...base, popularity: 100 };
    const next = purchaseGuest(state, 'wildBuddy');
    expect(next).toBe(state);
  });

  it('uses crypto.randomUUID as default id generator', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid' });
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = { ...base, popularity: 10, rolodex: [] };
    const next = purchaseGuest(state, 'oldFriend');
    expect(next.rolodex[0].id).toBe('uuid');
  });
});

describe('expandHouse', () => {
  it('deducts cash, increments capacity and houseCostIndex', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = { ...base, cash: 10, houseCapacity: 5, houseCostIndex: 0 };
    const next = expandHouse(state);
    expect(next.cash).toBe(8);
    expect(next.houseCapacity).toBe(6);
    expect(next.houseCostIndex).toBe(1);
  });

  it('refuses if not enough cash', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = { ...base, cash: 1, houseCostIndex: 0 };
    expect(expandHouse(state)).toBe(state);
  });

  it('refuses when at max capacity (34)', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = { ...base, cash: 30, houseCapacity: 34, houseCostIndex: 20 };
    expect(expandHouse(state)).toBe(state);
  });
});

describe('startNextParty', () => {
  it('resets trouble, ability flags, keeps bannedThisParty, phase=party', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const guardUsed = { id: 'g1', type: 'securityGuard', abilityUsed: true };
    const state = {
      ...base,
      trouble: 2,
      phase: 'shop',
      rolodex: [guardUsed],
      bannedThisParty: ['banned-id'],
    };
    const next = startNextParty(state, (a) => a);
    expect(next.trouble).toBe(0);
    expect(next.phase).toBe('party');
    expect(next.rolodex[0].abilityUsed).toBe(false);
    expect(next.bannedThisParty).toEqual(['banned-id']);
  });

  it('shuffles the rolodex using the provided shuffleFn', () => {
    const base = createInitialState({ idGen: makeIdGen(), shuffleFn: (a) => a });
    const state = { ...base, phase: 'shop' };
    const reversed = (a) => [...a].reverse();
    const next = startNextParty(state, reversed);
    expect(next.rolodex.map((g) => g.id)).toEqual([...state.rolodex].reverse().map((g) => g.id));
  });
});

describe('countStars', () => {
  it('counts guests with stars', () => {
    const house = [
      { id: 'a', type: 'alien', abilityUsed: false },
      { id: 'b', type: 'oldFriend', abilityUsed: false },
      { id: 'c', type: 'alien', abilityUsed: false },
    ];
    expect(countStars(house)).toBe(2);
  });
});
