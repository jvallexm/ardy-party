/**
 * Ardy Party — Optimal Win Simulation v2
 *
 * Key insights from v1:
 *   - Mr. Popular auto-invites → can cause overcapacity blame if house is full.
 *     Solution: don't invite Mr. Popular when house.length === houseCapacity - 1.
 *   - Caterers cost $-1 cash each, killing house-expansion budget.
 *     Solution: include richPals (and avoid too many caterers) to earn cash.
 *   - We need to accumulate 4 aliens simultaneously, not buy one and waste it.
 *     Solution: save up to buy 4 aliens in one shop phase (160 pop), OR buy
 *     them one at a time but expand house first so they don't cause overcapacity.
 *   - House needs cap ≥ 5 to hold 1 alien + 4 pop-generators (default is 5).
 *     But with mrPopular we need cap ≥ 6 when alien is in house.
 *
 * Revised strategy:
 *   Phase A (nights 1-8): Build cash & pop. Prioritise richPals for cash.
 *   Phase B: Expand house to 7+ using cash. Buy caterers/mrPopular for pop.
 *   Phase C: Save to 160p then buy all 4 aliens at once.
 *   Phase D: Fill house with 4 aliens → WIN.
 */

import {
  createInitialState,
  addGuestToParty,
  endParty,
  confirmSummary,
  blameGuest,
  purchaseGuest,
  expandHouse,
  startNextParty,
  scoreHouse,
  countStars,
  confirmDogReveal,
} from "./src/lib/gameState.js";

import { GUEST_TYPES, HOUSE_EXPANSION_COSTS } from "./src/lib/guests.js";

// ── Deterministic shuffle ─────────────────────────────────────────────────────
function smartShuffle(arr) {
  return [...arr].sort((a, b) => {
    const dA = GUEST_TYPES[a.type];
    const dB = GUEST_TYPES[b.type];
    if (dA.hasStar !== dB.hasStar) return dA.hasStar ? -1 : 1;
    if (dA.trouble !== dB.trouble) return dA.trouble ? 1 : -1;
    // Among non-trouble: caterer > mrPopular > oldFriend > richPal > dancer
    // (we bias toward pop guests since we need pop for aliens)
    return (dB.popBonus + dB.cashBonus) - (dA.popBonus + dA.cashBonus);
  });
}

// ── Guest picking ─────────────────────────────────────────────────────────────
function effectiveTroubleLimit(state) {
  return 3 + state.house.filter(g => g.type === "hippie").length;
}

function chooseGuest(state) {
  const cap = state.houseCapacity;
  const houseLen = state.house.length;
  if (houseLen >= cap) return null;

  const available = state.rolodex.filter(g => !state.bannedThisParty.includes(g.id));
  if (available.length === 0) return null;

  const limit = effectiveTroubleLimit(state);
  const headroom = limit - state.trouble;

  // Sort: aliens first, trouble last, by value otherwise
  const sorted = [...available].sort((a, b) => {
    const dA = GUEST_TYPES[a.type];
    const dB = GUEST_TYPES[b.type];
    if (dA.hasStar !== dB.hasStar) return dA.hasStar ? -1 : 1;
    if (dA.trouble !== dB.trouble) return dA.trouble ? 1 : -1;
    return (dB.popBonus + dB.cashBonus) - (dA.popBonus + dA.cashBonus);
  });

  for (const g of sorted) {
    const def = GUEST_TYPES[g.type];
    // Don't invite trouble if it would reach threshold
    if (def.trouble && headroom <= 1) continue;
    // Don't invite Mr. Popular when house is at cap-1 (he auto-invites → overcapacity)
    if (def.ability === "autoInvite" && houseLen === cap - 1) continue;
    return g;
  }
  return null;
}

function handleBlame(state) {
  // Eject least-valuable trouble guest first; fallback to least-valuable overall
  const trouble = state.house.filter(g => GUEST_TYPES[g.type].trouble);
  const pool = trouble.length ? trouble : state.house;
  const sorted = [...pool].sort(
    (a, b) => GUEST_TYPES[a.type].popBonus - GUEST_TYPES[b.type].popBonus
  );
  return blameGuest(state, sorted[0].id);
}

function playParty(state, lines) {
  let s = state;
  let iters = 0;

  while (s.phase === "party" && iters++ < 300) {
    const pick = chooseGuest(s);
    if (!pick) { s = endParty(s); break; }

    const name = `${GUEST_TYPES[pick.type].emoji}${GUEST_TYPES[pick.type].name}`;
    s = addGuestToParty(s, pick.id);
    if (lines) lines.push(`  invite ${name} → house[${s.house.length}/${s.houseCapacity}] trouble=${s.trouble}`);

    if (s.phase === "won") return s;

    if (s.phase === "dogReveal") {
      const revId = s.dogRevealGuestId;
      const rev = s.rolodex.find(g => g.id === revId);
      const boot = rev && GUEST_TYPES[rev.type].trouble;
      s = confirmDogReveal(s, boot ? "boot" : "keep");
    }
    if (s.phase === "blame") {
      if (lines) lines.push(`  BLAME (${s.blameContext})`);
      s = handleBlame(s);
      return s;
    }
    if (s.phase === "summary") break;
  }
  return s;
}

// ── Shop ──────────────────────────────────────────────────────────────────────
function doShop(state, lines) {
  let s = state;

  const aliensOwned = s.purchasedCounts["alien"] || 0;
  const aliensInDeck = s.rolodex.filter(g => g.type === "alien").length;

  // Expand house whenever we can. We need cap ≥ 6 before buying aliens
  // (alien + mrPopular auto-invite = 2 slots consumed at once).
  // With 4 aliens we need cap ≥ 4; aim for 7 to be comfortable.
  while (s.houseCapacity < 8) {
    const cost = HOUSE_EXPANSION_COSTS(s.houseCostIndex);
    if (s.cash < cost) break;
    const prev = s;
    s = expandHouse(s);
    if (s === prev) break;
    if (lines) lines.push(`  expand house → cap ${s.houseCapacity} (cost $${cost})`);
  }

  // Buy income guests (only if we don't yet have all 4 aliens)
  if (aliensOwned < 4) {
    for (const [type, maxOwn] of [["caterer", 2], ["mrPopular", 1]]) {
      const owned = s.purchasedCounts[type] || 0;
      const def = GUEST_TYPES[type];
      if (owned < maxOwn && s.popularity >= def.shopCost) {
        const prev = s;
        s = purchaseGuest(s, type);
        if (s !== prev && lines) lines.push(`  buy ${def.emoji}${def.name} (${def.shopCost}p)`);
      }
    }
  }

  // Buy aliens whenever affordable
  while (s.popularity >= 40) {
    const prev = s;
    s = purchaseGuest(s, "alien");
    if (s === prev) break;
    const total = s.rolodex.filter(g => g.type === "alien").length;
    if (lines) lines.push(`  buy 👽Alien (40p) → deck has ${total} alien(s), total bought=${s.purchasedCounts["alien"]}`);
  }

  return s;
}

// ── Single game ───────────────────────────────────────────────────────────────
function runGame(verbose) {
  const lines = verbose ? [] : null;
  let state = createInitialState({ mode: "classic", shuffleFn: smartShuffle });
  let night = 0;
  let iters = 0;

  while (state.phase !== "won" && state.nightsLeft > 0 && iters++ < 600) {
    if (state.phase === "party") {
      night++;
      if (lines) lines.push(`\n── Night ${night} (${state.nightsLeft} left | pop=${state.popularity} cash=${state.cash} cap=${state.houseCapacity} aliens=${state.rolodex.filter(g=>g.type==="alien").length}) ──`);
      state = playParty(state, lines);
      if (state.phase === "won") break;
    }

    if (state.phase === "summary") {
      const { pop, cash } = scoreHouse(state.house, state.houseCapacity);
      if (lines) lines.push(`  score +${pop}p +${cash}c | house: [${state.house.map(g=>GUEST_TYPES[g.type].name).join(", ")}]`);
      state = confirmSummary(state);
    }

    if (state.phase === "shop") {
      state = doShop(state, lines);
      state = startNextParty(state, smartShuffle);
    }
  }

  return { won: state.phase === "won", nights: night, state, lines };
}

// ── Batch simulation ──────────────────────────────────────────────────────────
const RUNS = 1000;
let wins = 0, totalNights = 0, minNights = Infinity, maxNights = 0;

for (let i = 0; i < RUNS; i++) {
  const r = runGame(false);
  if (r.won) {
    wins++;
    totalNights += r.nights;
    if (r.nights < minNights) minNights = r.nights;
    if (r.nights > maxNights) maxNights = r.nights;
  }
}

console.log(`\n╔══════════════════════════════════════════════════╗`);
console.log(`║  Ardy Party Simulation v2 — ${RUNS} games, classic  `);
console.log(`╚══════════════════════════════════════════════════╝`);
console.log(`Win rate  : ${wins}/${RUNS} (${((wins/RUNS)*100).toFixed(1)}%)`);
if (wins > 0) {
  console.log(`Avg nights: ${(totalNights/wins).toFixed(1)}`);
  console.log(`Fastest   : ${minNights} nights`);
  console.log(`Slowest   : ${maxNights} nights`);
}

console.log("\n── VERBOSE TRACE (single game) ──");
const trace = runGame(true);
trace.lines.forEach(l => console.log(l));
console.log();
if (trace.won) {
  console.log(`RESULT: WIN in ${trace.nights} nights`);
  console.log(`Winning house: ${trace.state.house.map(g=>`${GUEST_TYPES[g.type].emoji}${GUEST_TYPES[g.type].name}`).join(", ")}`);
  console.log(`Stars: ${countStars(trace.state.house)} | Aliens bought: ${trace.state.purchasedCounts["alien"] || 0}`);
} else {
  console.log(`RESULT: LOSS — phase=${trace.state.phase} nights=${trace.nights} pop=${trace.state.popularity} aliens_bought=${trace.state.purchasedCounts["alien"]||0}`);
  console.log(`Deck: ${trace.state.rolodex.map(g=>GUEST_TYPES[g.type].name).join(", ")}`);
}
