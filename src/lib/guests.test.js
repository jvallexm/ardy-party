import { describe, it, expect } from "vitest";
import {
  GUEST_TYPES,
  SHOP_GUESTS,
  HOUSE_EXPANSION_COSTS,
  buildTestShop,
} from "./guests.js";

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
    expect(g.description).toBeNull();
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

describe("buildTestShop", () => {
  const identityShuffle = (a) => a;

  it("always includes oldFriend, richPal, and alien", () => {
    const shop = buildTestShop(identityShuffle);
    expect(shop).toContain("oldFriend");
    expect(shop).toContain("richPal");
    expect(shop).toContain("alien");
  });

  it("contains exactly 9 entries", () => {
    const shop = buildTestShop(identityShuffle);
    expect(shop.length).toBe(9);
  });

  it("contains no duplicates", () => {
    const shop = buildTestShop(identityShuffle);
    expect(new Set(shop).size).toBe(shop.length);
  });

  it("picks 3 from pool A (monkey/driver/securityGuard/ticketTaker/hippie/dog)", () => {
    const poolA = [
      "monkey",
      "driver",
      "securityGuard",
      "ticketTaker",
      "hippie",
      "dog",
    ];
    const shop = buildTestShop(identityShuffle);
    const fromA = shop.filter((k) => poolA.includes(k));
    expect(fromA.length).toBe(3);
  });

  it("picks 2 from pool B (rockStar/comedian/caterer/mrPopular)", () => {
    const poolB = ["rockStar", "comedian", "caterer", "mrPopular"];
    const shop = buildTestShop(identityShuffle);
    const fromB = shop.filter((k) => poolB.includes(k));
    expect(fromB.length).toBe(2);
  });

  it("picks 1 from pool C (dancer/auctioneer)", () => {
    const poolC = ["dancer", "auctioneer"];
    const shop = buildTestShop(identityShuffle);
    const fromC = shop.filter((k) => poolC.includes(k));
    expect(fromC.length).toBe(1);
  });

  it("is sorted by shopCost ascending", () => {
    const shop = buildTestShop(identityShuffle);
    for (let i = 1; i < shop.length; i++) {
      expect(GUEST_TYPES[shop[i]].shopCost).toBeGreaterThanOrEqual(
        GUEST_TYPES[shop[i - 1]].shopCost,
      );
    }
  });

  it("uses shuffleFn to randomize pool selection", () => {
    const reverseShuffle = (a) => [...a].reverse();
    const shop = buildTestShop(reverseShuffle);
    expect(shop.length).toBe(9);
    expect(new Set(shop).size).toBe(9);
  });

  it("works with the default shuffle (no shuffleFn argument)", () => {
    const shop = buildTestShop();
    expect(shop.length).toBe(9);
  });

  it("fills sold-out slot with an available guest — no null when pool has replacements", () => {
    // monkey is sold out, but driver/securityGuard/ticketTaker/hippie/dog are available
    const purchasedCounts = { monkey: 4 };
    const shop = buildTestShop(identityShuffle, purchasedCounts);
    expect(shop).not.toContain("monkey");
    expect(shop).not.toContain(null);
  });

  it("null only appears when pool is fully exhausted", () => {
    // 5 of 6 pool A sold out → only dog available → 1 fills, 2 slots null
    const purchasedCounts = {
      monkey: 4,
      driver: 4,
      securityGuard: 4,
      ticketTaker: 4,
      hippie: 4,
    };
    const shop = buildTestShop(identityShuffle, purchasedCounts);
    expect(shop).not.toContain("monkey");
    expect(shop).not.toContain("driver");
    expect(shop.length).toBe(9);
    expect(shop.filter((k) => k === null).length).toBe(2);
  });

  it("marks always-slot as null when sold out", () => {
    const purchasedCounts = { oldFriend: 4 };
    const shop = buildTestShop(identityShuffle, purchasedCounts);
    expect(shop).not.toContain("oldFriend");
    expect(shop.filter((k) => k === null).length).toBeGreaterThanOrEqual(1);
  });
});

describe("HOUSE_EXPANSION_COSTS", () => {
  it("starts at $2 and increases by $1 per step up to $12", () => {
    expect(HOUSE_EXPANSION_COSTS(0)).toBe(2);
    expect(HOUSE_EXPANSION_COSTS(1)).toBe(3);
    expect(HOUSE_EXPANSION_COSTS(2)).toBe(4);
    expect(HOUSE_EXPANSION_COSTS(10)).toBe(12);
    expect(HOUSE_EXPANSION_COSTS(11)).toBe(12);
    expect(HOUSE_EXPANSION_COSTS(100)).toBe(12);
  });
});
