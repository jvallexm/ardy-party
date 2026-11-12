/* eslint-disable no-unused-vars */
/**
 * Ardy Party Win Simulation — Optimal Strategy
 * Goal: Get 4 aliens in the house simultaneously (phase === "won")
 * Strategy: Accumulate popularity as fast as possible, buy aliens at 40 pop each,
 * invite them to parties until 4 are in the house at once.
 */

import {
  createInitialState,
  addGuestToParty,
  endParty,
  confirmSummary,
  purchaseGuest,
  startNextParty,
  blameGuest,
  scoreHouse,
  countStars,
} from "./src/lib/gameState.js";

import { GUEST_TYPES } from "./src/lib/guests.js";

function describeGuest(g) {
  const def = GUEST_TYPES[g.type];
  return `${def.emoji}${def.name}`;
}

// Sort rolodex guest objects: aliens first, then by popBonus descending, trouble guests last.
// Mr. Popular goes near end to avoid overcapacity. Strings (buildTestShop) returned as-is.
function smartShuffle(arr) {
  if (!arr.length || typeof arr[0] === "string") return [...arr];
  return [...arr].sort((a, b) => {
    const defA = GUEST_TYPES[a.type];
    const defB = GUEST_TYPES[b.type];
    if (defA.hasStar && !defB.hasStar) return -1;
    if (!defA.hasStar && defB.hasStar) return 1;
    // Mr. Popular goes after non-trouble non-alien (overcapacity risk)
    if (a.type === "mrPopular" && b.type !== "mrPopular" && !defB.trouble) return 1;
    if (b.type === "mrPopular" && a.type !== "mrPopular" && !defA.trouble) return -1;
    if (defA.trouble && !defB.trouble) return 1;
    if (!defA.trouble && defB.trouble) return -1;
    return defB.popBonus - defA.popBonus;
  });
}

function troubleLimit(state) {
  const hippies = state.house.filter((g) => g.type === "hippie").length;
  return 3 + hippies;
}

function pickBestGuest(state) {
  const available = state.rolodex.filter(
    (g) => !state.bannedThisParty.includes(g.id)
  );
  if (available.length === 0) return null;

  const slotsLeft = state.houseCapacity - state.house.length;

  // 1. Aliens — always invite first (the goal!)
  const aliens = available.filter((g) => GUEST_TYPES[g.type].hasStar);
  if (aliens.length > 0 && slotsLeft >= 1) return aliens[0];

  // 2. Mr. Popular — only when 2+ slots remain (auto-invite fills one more)
  const mrPops = available.filter((g) => g.type === "mrPopular");
  if (mrPops.length > 0 && slotsLeft >= 2) return mrPops[0];

  // 3. Hippie if trouble is building up
  const hippies = available.filter((g) => g.type === "hippie");
  if (hippies.length > 0 && state.trouble > 0 && slotsLeft >= 1) return hippies[0];

  // 4. High-pop non-trouble guests (caterer, rockstar, etc.)
  const highPop = available
    .filter(
      (g) =>
        !GUEST_TYPES[g.type].hasStar &&
        !GUEST_TYPES[g.type].trouble &&
        g.type !== "mrPopular" &&
        g.type !== "hippie" &&
        GUEST_TYPES[g.type].popBonus > 0
    )
    .sort((a, b) => GUEST_TYPES[b.type].popBonus - GUEST_TYPES[a.type].popBonus);
  if (highPop.length > 0 && slotsLeft >= 1) return highPop[0];

  // 5. Hippie as filler
  if (hippies.length > 0 && slotsLeft >= 1) return hippies[0];

  // 6. Neutral (cash, 0 pop) non-trouble guests
  const neutral = available.filter(
    (g) =>
      !GUEST_TYPES[g.type].hasStar &&
      !GUEST_TYPES[g.type].trouble &&
      g.type !== "mrPopular" &&
      g.type !== "hippie" &&
      GUEST_TYPES[g.type].popBonus === 0
  );
  if (neutral.length > 0 && slotsLeft >= 1) return neutral[0];

  // 7. Trouble guests only if well under the limit
  const troubleGuests = available
    .filter((g) => GUEST_TYPES[g.type].trouble)
    .sort((a, b) => GUEST_TYPES[b.type].popBonus - GUEST_TYPES[a.type].popBonus);
  if (troubleGuests.length > 0 && slotsLeft >= 1 && state.trouble < troubleLimit(state) - 1) {
    return troubleGuests[0];
  }

  return null;
}

function simulate() {
  let state = createInitialState({ mode: "test", shuffleFn: smartShuffle });

  console.log("=== ARDY PARTY SIMULATION ===");
  console.log(
    `Start: ${state.nightsLeft} nights, pop=${state.popularity}, cash=${state.cash}, houseCapacity=${state.houseCapacity}`
  );
  console.log(`Initial rolodex (${state.rolodex.length}): ${state.rolodex.map(describeGuest).join(", ")}`);
  console.log("");

  let nightNum = 0;
  const maxNights = 60;

  while (state.phase !== "won" && nightNum < maxNights) {
    if (state.nightsLeft <= 0) {
      console.log("OUT OF NIGHTS — game over before win");
      break;
    }

    // ── SHOP PHASE ──────────────────────────────────────────────────────────
    if (state.phase === "shop") {
      console.log(
        `--- SHOP (after night ${nightNum}, nights left: ${state.nightsLeft}, pop=${state.popularity}, cash=${state.cash}) ---`
      );

      const shop = state.testShop || [];
      console.log(
        `  Shop: ${shop.map((s) => (s ? `${s}(${GUEST_TYPES[s].shopCost})` : "SOLD OUT")).join(", ")}`
      );

      // ── Alien purchases: buy as many as we can afford ──────────────────────
      {
        let bought = true;
        while (bought) {
          bought = false;
          if (state.popularity >= 40) {
            const prevPop = state.popularity;
            state = purchaseGuest(state, "alien");
            if (state.popularity < prevPop) {
              console.log(`  Bought alien! Pop now: ${state.popularity}`);
              bought = true;
            }
          }
        }
      }

      // ── Pop-generator investments (only when below alien threshold) ─────────
      // Prioritize best pop-per-cost from shop. Avoid buying if we're close to 40 pop
      // and spending would delay the next alien purchase.
      {
        const availableShop = (state.testShop || []).filter(Boolean);
        // Best pop-generators by pop/cost ratio (no trouble, no mrPopular auto-invite risk)
        const popGenPriority = ["caterer", "oldFriend", "richPal"];
        // caterer: 4 pop, 5 cost = 0.8 | oldFriend: 1 pop, 2 cost = 0.5 | richPal: cash

        for (const key of popGenPriority) {
          if (!availableShop.includes(key)) continue;
          const def = GUEST_TYPES[key];
          const purchased = state.purchasedCounts[key] || 0;
          if (purchased >= def.maxPurchase) continue;
          if (state.popularity < def.shopCost) continue;
          // Don't spend if remaining pop would be >= 35 (save for alien rounding)
          // But do spend if we have leftover that can't reach 40
          const afterPurchase = state.popularity - def.shopCost;
          // Skip if we'd be in the 30-39 "almost alien" zone after buying
          // (better to keep those 5 and try to earn the remaining 5)
          if (afterPurchase >= 30 && afterPurchase < 40) {
            // Only buy if it's a free slot (cost <= remainder that can't hit 40 alone)
            // e.g., pop=34 and cat costs 5 → 29 leftover, fine
            // but pop=38 and cat costs 5 → 33 leftover, we just wasted nearly-alien pop
            if (state.popularity >= 35) continue; // skip: too close to 40
          }
          const prev = state.popularity;
          state = purchaseGuest(state, key);
          if (state.popularity < prev) {
            console.log(`  Bought ${key} (+${def.popBonus}pop, cost ${def.shopCost}) → pop=${state.popularity}`);
          }
        }
      }

      state = startNextParty(state, smartShuffle);
      console.log(
        `  Starting party! Rolodex (${state.rolodex.length}): ${state.rolodex.map(describeGuest).join(", ")}`
      );
      console.log("");
      continue;
    }

    // ── PARTY PHASE ──────────────────────────────────────────────────────────
    if (state.phase === "party") {
      nightNum++;
      console.log(
        `=== NIGHT ${nightNum} (${state.nightsLeft} nights left, pop=${state.popularity}) ===`
      );

      let steps = 0;
      while (state.phase === "party" && steps < 100) {
        if (state.house.length >= state.houseCapacity) {
          state = endParty(state);
          break;
        }

        const pick = pickBestGuest(state);
        if (!pick) {
          state = endParty(state);
          break;
        }

        state = addGuestToParty(state, pick.id);
        steps++;

        const houseDesc = state.house.map(describeGuest).join(", ");
        console.log(
          `  +${describeGuest(pick)} | House[${state.house.length}/${state.houseCapacity}]: ${houseDesc} | trouble=${state.trouble}`
        );

        if (state.phase === "won") {
          console.log("  *** WIN CONDITION MET ***");
          break;
        }

        if (state.phase === "blame") {
          console.log(`  BLAME triggered! (${state.blameContext})`);
          // Eject lowest-value trouble guest, or lowest-value guest overall
          const candidates = state.house.filter((g) => GUEST_TYPES[g.type].trouble);
          const pool = candidates.length > 0 ? candidates : state.house;
          const ejected = [...pool].sort(
            (a, b) => GUEST_TYPES[a.type].popBonus - GUEST_TYPES[b.type].popBonus
          )[0];
          console.log(`  Ejecting ${describeGuest(ejected)}`);
          state = blameGuest(state, ejected.id);
          break; // blame -> shop, exit party loop
        }
      }

      if (state.phase === "won") break;

      if (state.phase === "summary") {
        const { pop, cash } = scoreHouse(state.house, state.houseCapacity);
        console.log(
          `  Party over. Final house: ${state.house.map(describeGuest).join(", ")}`
        );
        console.log(`  Score: +${pop} pop, +${cash} cash`);
        state = confirmSummary(state);
        console.log(`  After summary: pop=${state.popularity}, cash=${state.cash}`);
      }
    }
  }

  console.log("");
  console.log("=== SIMULATION RESULT ===");
  if (state.phase === "won") {
    console.log(`STATUS: WIN!`);
    console.log(`Nights taken: ${nightNum}`);
    console.log(`Nights remaining: ${state.nightsLeft}`);
    console.log(`Final pop: ${state.popularity}, cash: ${state.cash}`);
    console.log(`Winning house (${state.house.length} guests): ${state.house.map(describeGuest).join(", ")}`);
    console.log(`Stars in house: ${countStars(state.house)} / 4`);
    console.log(`Total aliens purchased: ${state.purchasedCounts["alien"] || 0}`);
  } else {
    console.log(`STATUS: LOSS`);
    console.log(`Phase at end: ${state.phase}`);
    console.log(`Nights played: ${nightNum}`);
    console.log(`Aliens purchased: ${state.purchasedCounts["alien"] || 0}`);
    console.log(`Popularity: ${state.popularity}`);
  }
}

simulate();
