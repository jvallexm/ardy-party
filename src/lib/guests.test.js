import { describe, it, expect } from "vitest";
import { GUEST_TYPES, SHOP_GUESTS, HOUSE_EXPANSION_COSTS } from "./guests.js";

describe("GUEST_TYPES", () => {
  it("defines oldFriend", () => {
    const g = GUEST_TYPES.oldFriend;
    expect(g.name).toBe("Old Friend");
    expect(g.emoji).toBe("🧑");
    expect(g.popBonus).toBe(1);
    expect(g.cashBonus).toBe(0);
    expect(g.trouble).toBe(false);
    expect(g.ability).toBeNull();
    expect(g.shopCost).toBe(2);
    expect(g.hasStar).toBe(false);
    expect(g.maxPurchase).toBe(4);
  });

  it("defines wildBuddy with trouble and no shop cost", () => {
    const g = GUEST_TYPES.wildBuddy;
    expect(g.popBonus).toBe(2);
    expect(g.trouble).toBe(true);
    expect(g.shopCost).toBeNull();
  });

  it("defines richPal with cash bonus", () => {
    const g = GUEST_TYPES.richPal;
    expect(g.cashBonus).toBe(1);
    expect(g.shopCost).toBe(3);
  });

  it("defines driver with driver ability", () => {
    const g = GUEST_TYPES.driver;
    expect(g.ability).toBe("driver");
    expect(g.abilityIcon).toBe("⬇️");
    expect(g.shopCost).toBe(3);
  });

  it("defines monkey with trouble", () => {
    const g = GUEST_TYPES.monkey;
    expect(g.popBonus).toBe(4);
    expect(g.trouble).toBe(true);
    expect(g.shopCost).toBe(4);
  });

  it("defines securityGuard with kick ability", () => {
    const g = GUEST_TYPES.securityGuard;
    expect(g.ability).toBe("kick");
    expect(g.abilityIcon).toBe("👢");
    expect(g.shopCost).toBe(4);
  });

  it("defines ticketTaker", () => {
    const g = GUEST_TYPES.ticketTaker;
    expect(g.popBonus).toBe(-1);
    expect(g.cashBonus).toBe(2);
    expect(g.shopCost).toBe(4);
  });

  it("defines caterer", () => {
    const g = GUEST_TYPES.caterer;
    expect(g.popBonus).toBe(4);
    expect(g.cashBonus).toBe(-1);
    expect(g.shopCost).toBe(5);
  });

  it("defines dog with reveal ability", () => {
    const g = GUEST_TYPES.dog;
    expect(g.ability).toBe("reveal");
    expect(g.popBonus).toBe(2);
    expect(g.shopCost).toBe(4);
  });

  it("defines hippie with removeTrouble ability", () => {
    const g = GUEST_TYPES.hippie;
    expect(g.ability).toBe("removeTrouble");
    expect(g.popBonus).toBe(1);
  });

  it("defines rockStar with trouble", () => {
    const g = GUEST_TYPES.rockStar;
    expect(g.popBonus).toBe(3);
    expect(g.cashBonus).toBe(2);
    expect(g.trouble).toBe(true);
    expect(g.shopCost).toBe(5);
  });

  it("defines comedian", () => {
    const g = GUEST_TYPES.comedian;
    expect(g.ability).toBe("fullHouseBonus");
    expect(g.cashBonus).toBe(-1);
    expect(g.shopCost).toBe(5);
  });

  it("defines mrPopular with autoInvite", () => {
    const g = GUEST_TYPES.mrPopular;
    expect(g.ability).toBe("autoInvite");
    expect(g.popBonus).toBe(3);
    expect(g.shopCost).toBe(5);
    expect(g.abilityIcon).toBe("+1");
  });

  it("defines dancer", () => {
    const g = GUEST_TYPES.dancer;
    expect(g.shopCost).toBe(7);
    expect(g.abilityIcon).toBe("🎵");
  });

  it("defines auctioneer", () => {
    const g = GUEST_TYPES.auctioneer;
    expect(g.cashBonus).toBe(3);
    expect(g.shopCost).toBe(9);
  });

  it("defines alien with star and infinite purchase", () => {
    const g = GUEST_TYPES.alien;
    expect(g.hasStar).toBe(true);
    expect(g.shopCost).toBe(40);
    expect(g.maxPurchase).toBe(Infinity);
  });
});

describe("SHOP_GUESTS", () => {
  it("contains only guests with shopCost", () => {
    SHOP_GUESTS.forEach((key) => {
      expect(GUEST_TYPES[key].shopCost).not.toBeNull();
    });
  });

  it("excludes wildBuddy (starting only)", () => {
    expect(SHOP_GUESTS).not.toContain("wildBuddy");
  });

  it("is sorted by shop cost ascending", () => {
    for (let i = 1; i < SHOP_GUESTS.length; i++) {
      const prev = GUEST_TYPES[SHOP_GUESTS[i - 1]].shopCost;
      const curr = GUEST_TYPES[SHOP_GUESTS[i]].shopCost;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});

describe("HOUSE_EXPANSION_COSTS", () => {
  it("starts at $2 and increases by $2 per step up to $12", () => {
    expect(HOUSE_EXPANSION_COSTS(0)).toBe(2);
    expect(HOUSE_EXPANSION_COSTS(1)).toBe(4);
    expect(HOUSE_EXPANSION_COSTS(2)).toBe(6);
    expect(HOUSE_EXPANSION_COSTS(3)).toBe(8);
    expect(HOUSE_EXPANSION_COSTS(4)).toBe(10);
    expect(HOUSE_EXPANSION_COSTS(5)).toBe(12);
    expect(HOUSE_EXPANSION_COSTS(6)).toBe(12);
    expect(HOUSE_EXPANSION_COSTS(100)).toBe(12);
  });
});
