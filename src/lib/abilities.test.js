import { describe, it, expect } from "vitest";
import { activateAbility, kickGuest, confirmDogReveal } from "./abilities.js";
import { createInitialState } from "./gameState.js";

function makeIdGen() {
  let i = 0;
  return () => `id-${++i}`;
}

describe("activateAbility", () => {
  it("driver sets driverMode and marks ability used", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const driver = { id: "d1", type: "driver", abilityUsed: false };
    const state = { ...base, house: [driver], rolodex: [] };
    const result = activateAbility(state, driver.id);
    expect(result.house[0].abilityUsed).toBe(true);
    expect(result.driverMode).toEqual({ driverId: "d1" });
    expect(result.house).toHaveLength(1);
  });

  it("dog sets dogRevealGuestId to next rolodex id and phase", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const dog = { id: "d1", type: "dog", abilityUsed: false };
    const next = { id: "n1", type: "oldFriend", abilityUsed: false };
    const state = { ...base, house: [dog], rolodex: [next] };
    const result = activateAbility(state, dog.id);
    expect(result.dogRevealGuestId).toBe("n1");
    expect(result.phase).toBe("dogReveal");
    expect(result.house[0].abilityUsed).toBe(true);
  });

  it("dog does nothing when rolodex is empty", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const dog = { id: "d1", type: "dog", abilityUsed: false };
    const state = { ...base, house: [dog], rolodex: [] };
    const result = activateAbility(state, dog.id);
    expect(result).toBe(state);
  });

  it("dog skips banned guests when revealing", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const dog = { id: "d1", type: "dog", abilityUsed: false };
    const banned = { id: "b", type: "oldFriend", abilityUsed: false };
    const next = { id: "n", type: "oldFriend", abilityUsed: false };
    const state = {
      ...base,
      house: [dog],
      rolodex: [banned, next],
      bannedThisParty: ["b"],
    };
    const result = activateAbility(state, dog.id);
    expect(result.dogRevealGuestId).toBe("n");
  });

  it("securityGuard returns kickMode", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const guard = { id: "g1", type: "securityGuard", abilityUsed: false };
    const state = { ...base, house: [guard] };
    const result = activateAbility(state, guard.id);
    expect(result.kickMode).toEqual({ kickerId: "g1" });
  });

  it("is a no-op if the guest has no ability", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const friend = { id: "f1", type: "oldFriend", abilityUsed: false };
    const state = { ...base, house: [friend] };
    expect(activateAbility(state, friend.id)).toBe(state);
  });

  it("is a no-op if guest not found", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    expect(activateAbility(base, "nope")).toBe(base);
  });

  it("is a no-op for comedian (fullHouseBonus is passive)", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const com = { id: "c1", type: "comedian", abilityUsed: false };
    const state = { ...base, house: [com] };
    const result = activateAbility(state, com.id);
    expect(result).toBe(state);
  });

  it("is a no-op if ability already used", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const driver = { id: "d", type: "driver", abilityUsed: true };
    const state = { ...base, house: [driver] };
    expect(activateAbility(state, driver.id)).toBe(state);
  });
});

describe("kickGuest", () => {
  it("kicks target out and marks kicker ability used, clears kickMode", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const guard = { id: "g1", type: "securityGuard", abilityUsed: false };
    const target = { id: "t1", type: "wildBuddy", abilityUsed: false };
    const state = {
      ...base,
      house: [guard, target],
      kickMode: { kickerId: "g1" },
      trouble: 1,
    };
    const result = kickGuest(state, "g1", "t1");
    expect(result.house.map((g) => g.id)).toEqual(["g1"]);
    expect(result.house[0].abilityUsed).toBe(true);
    expect(result.bannedThisParty).toContain("t1");
    expect(result.kickMode).toBeUndefined();
  });

  it("reduces trouble when kicking a trouble guest", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const guard = { id: "g1", type: "securityGuard", abilityUsed: false };
    const target = { id: "t1", type: "wildBuddy", abilityUsed: false };
    const state = {
      ...base,
      house: [guard, target],
      kickMode: { kickerId: "g1" },
      trouble: 2,
    };
    const result = kickGuest(state, "g1", "t1");
    expect(result.trouble).toBe(1);
  });

  it("does not change trouble when kicking a non-trouble guest", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const guard = { id: "g1", type: "securityGuard", abilityUsed: false };
    const target = { id: "t1", type: "oldFriend", abilityUsed: false };
    const state = {
      ...base,
      house: [guard, target],
      kickMode: { kickerId: "g1" },
      trouble: 2,
    };
    const result = kickGuest(state, "g1", "t1");
    expect(result.trouble).toBe(2);
  });

  it("returns kicked guest to rolodex so they come back next party", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const guard = { id: "g1", type: "securityGuard", abilityUsed: false };
    const target = { id: "t1", type: "wildBuddy", abilityUsed: false };
    const state = {
      ...base,
      house: [guard, target],
      rolodex: [],
      kickMode: { kickerId: "g1" },
    };
    const result = kickGuest(state, "g1", "t1");
    expect(result.rolodex.find((g) => g.id === "t1")).toBeDefined();
    expect(result.bannedThisParty).toContain("t1");
  });

  it("does not modify rolodex when target is not found in house", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const guard = { id: "g1", type: "securityGuard", abilityUsed: false };
    const state = {
      ...base,
      house: [guard],
      rolodex: [],
      kickMode: { kickerId: "g1" },
    };
    const result = kickGuest(state, "g1", "unknown-id");
    expect(result.rolodex).toEqual([]);
  });
});

describe("confirmDogReveal", () => {
  it("boot bans the revealed guest for this party but keeps them in rolodex", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const dog = { id: "d1", type: "dog", abilityUsed: true };
    const booted = { id: "r1", type: "wildBuddy", abilityUsed: false };
    const state = {
      ...base,
      house: [dog],
      rolodex: [booted],
      dogRevealGuestId: "r1",
      phase: "dogReveal",
      bannedThisParty: [],
    };
    const result = confirmDogReveal(state, "boot");
    expect(result.rolodex.find((g) => g.id === "r1")).toBeDefined();
    expect(result.bannedThisParty).toContain("r1");
    expect(result.dogRevealGuestId).toBeNull();
    expect(result.phase).toBe("party");
  });

  it("keep leaves rolodex intact", () => {
    const base = createInitialState({
      idGen: makeIdGen(),
      shuffleFn: (a) => a,
    });
    const dog = { id: "d1", type: "dog", abilityUsed: true };
    const kept = { id: "r1", type: "wildBuddy", abilityUsed: false };
    const state = {
      ...base,
      house: [dog],
      rolodex: [kept],
      dogRevealGuestId: "r1",
      phase: "dogReveal",
    };
    const result = confirmDogReveal(state, "keep");
    expect(result.rolodex.map((g) => g.id)).toEqual(["r1"]);
    expect(result.dogRevealGuestId).toBeNull();
    expect(result.phase).toBe("party");
  });
});
