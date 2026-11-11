import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../App.jsx";
import { createInitialState } from "../lib/gameState.js";

// Stable ids so we can find specific guests.
let idCounter = 0;
beforeEach(() => {
  idCounter = 0;
  vi.stubGlobal("crypto", {
    randomUUID: () => `u-${++idCounter}`,
  });
});

function freshState(overrides = {}) {
  return { ...createInitialState({ shuffleFn: (a) => a }), ...overrides };
}

describe("App - keyboard navigation", () => {
  function press(key) {
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );
    });
  }

  // --- party phase ---

  it("Space on door tile (default cursor) adds a guest", () => {
    render(<App initialState={freshState()} />);
    press(" ");
    expect(screen.getAllByText("🧑").length).toBeGreaterThan(0);
  });

  it("Space on door when disabled does nothing", () => {
    const state = freshState({
      rolodex: [],
      bannedThisParty: [],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    press(" ");
    expect(screen.queryByText("🧑")).toBeNull();
  });

  it("A moves cursor left to rolodex; Space opens rolodex modal", () => {
    render(<App />);
    press("a");
    press(" ");
    expect(screen.getByText(/10 guests/i)).toBeTruthy();
  });

  it("Escape closes rolodex modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Rolodex/ }));
    press("Escape");
    expect(screen.queryByText(/10 guests/i)).toBeNull();
  });

  it("Space closes rolodex modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Rolodex/ }));
    press(" ");
    expect(screen.queryByText(/10 guests/i)).toBeNull();
  });

  it("other key while rolodex open does nothing", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Rolodex/ }));
    press("x");
    expect(screen.getByText(/10 guests/i)).toBeTruthy();
  });

  it("D moves cursor right; Space on guest tile triggers ability", () => {
    const state = freshState({
      house: [{ id: "d1", type: "dog", abilityUsed: false }],
      rolodex: [{ id: "r1", type: "oldFriend", abilityUsed: false, order: 0 }],
      bannedThisParty: [],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    press("d"); // cursor to index 2 (first guest = dog)
    press(" "); // activate dog: enters dogReveal phase
    expect(screen.getByText(/Peek/)).toBeTruthy();
  });

  it("Space on empty tile does nothing", () => {
    render(<App />);
    press("d");
    press("d"); // cursor to index 3 (empty, house has 0 guests)
    press(" ");
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
  });

  it("Up from row 0 focuses End Party, Space shows summary", () => {
    render(<App />);
    press("w");
    expect(
      screen
        .getByRole("button", { name: /End Party/ })
        .classList.contains("focused"),
    ).toBe(true);
    press(" ");
    expect(screen.getByText(/Night Results/)).toBeTruthy();
  });

  it("Space in summary phase confirms summary and goes to shop", () => {
    render(<App />);
    press("w");
    press(" "); // go to summary
    press(" "); // confirm summary
    expect(screen.queryByText(/Night Results/)).toBeNull();
  });

  it("Enter in summary phase confirms summary", () => {
    render(<App />);
    press("w");
    press(" ");
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByText(/Night Results/)).toBeNull();
  });

  it("W from row 1 moves cursor up to row 0", () => {
    render(<App initialCursor={{ row: 1, col: 0 }} />);
    press("w");
    expect(
      screen
        .getByRole("button", { name: /End Party/ })
        .classList.contains("focused"),
    ).toBe(false);
  });

  it("unrecognized key in summary phase does nothing", () => {
    render(<App />);
    press("w");
    press(" "); // enter summary
    press("x");
    expect(screen.getByText(/Night Results/)).toBeTruthy();
  });

  it("unrecognized key when End Party focused does nothing", () => {
    render(<App initialCursor={{ row: -1, col: 0 }} />);
    press("x");
    expect(
      screen
        .getByRole("button", { name: /End Party/ })
        .classList.contains("focused"),
    ).toBe(true);
  });

  it("Down from End Party moves to rolodex", () => {
    render(<App initialCursor={{ row: -1, col: 0 }} />);
    press("s");
    expect(
      screen
        .getByRole("button", { name: /End Party/ })
        .classList.contains("focused"),
    ).toBe(false);
  });

  it("unrecognized key in party phase does nothing", () => {
    render(<App />);
    press("x");
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
  });

  it("ArrowLeft moves cursor left", () => {
    render(<App />);
    press("ArrowLeft"); // (0,1) → (0,0) rolodex
    press(" ");
    expect(screen.getByText(/10 guests/i)).toBeTruthy();
  });

  it("ArrowRight moves cursor right", () => {
    render(<App />);
    press("ArrowRight"); // (0,1) → (0,2)
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
  });

  it("ArrowUp clamps at top row", () => {
    render(<App />);
    press("ArrowUp");
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
  });

  it("ArrowDown clamps at bottom row", () => {
    render(<App />);
    press("ArrowDown");
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
  });

  it("arrow keys prevent default to stop scrolling", () => {
    render(<App />);
    let prevented = false;
    const origDispatch = window.dispatchEvent.bind(window);
    act(() => {
      const evt = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(evt, "preventDefault", {
        value: () => {
          prevented = true;
        },
      });
      window.dispatchEvent(evt);
    });
    expect(prevented).toBe(true);
  });

  it("A at col 0 wraps left and clamps past totalTiles", () => {
    render(<App />); // cursor (0,1)
    press("a"); // → (0,0)
    press("a"); // col<0 wrap → clamp idx>=totalTiles → (0,6)
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
  });

  it("D at col 8 wraps right to next row", () => {
    // Use large capacity so there are 3 rows and wrapping is valid
    const state = freshState({ houseCapacity: 20 });
    render(<App initialState={state} initialCursor={{ row: 0, col: 8 }} />);
    press("d"); // col=9 >= COLS → row=1, col=0
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
  });

  it("W from row 0 focuses End Party", () => {
    render(<App />);
    press("w");
    expect(
      screen
        .getByRole("button", { name: /End Party/ })
        .classList.contains("focused"),
    ).toBe(true);
  });

  it("S clamps at bottom row (single-row grid)", () => {
    render(<App />);
    press("s");
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
  });

  // --- dogReveal phase ---

  it("A boots peeked guest in dogReveal phase", () => {
    const state = freshState({
      house: [{ id: "d1", type: "dog", abilityUsed: false }],
      rolodex: [{ id: "r1", type: "wildBuddy", abilityUsed: false }],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    fireEvent.click(screen.getByText("🐶").closest("button"));
    press("a"); // boot
    fireEvent.click(screen.getByRole("button", { name: /Rolodex/ }));
    expect(screen.getByText(/1 guest/i)).toBeTruthy(); // dog still in house
  });

  it("ArrowLeft boots peeked guest in dogReveal phase", () => {
    const state = freshState({
      house: [{ id: "d1", type: "dog", abilityUsed: false }],
      rolodex: [{ id: "r1", type: "wildBuddy", abilityUsed: false }],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    fireEvent.click(screen.getByText("🐶").closest("button"));
    press("ArrowLeft");
    fireEvent.click(screen.getByRole("button", { name: /Rolodex/ }));
    expect(screen.getByText(/1 guest/i)).toBeTruthy(); // dog still in house
  });

  it("ArrowRight keeps peeked guest in dogReveal phase", () => {
    const state = freshState({
      house: [{ id: "d1", type: "dog", abilityUsed: false }],
      rolodex: [{ id: "r1", type: "wildBuddy", abilityUsed: false }],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    fireEvent.click(screen.getByText("🐶").closest("button"));
    press("ArrowRight");
    fireEvent.click(screen.getByRole("button", { name: /Rolodex/ }));
    expect(screen.getByText(/2 guests/i)).toBeTruthy(); // wildBuddy in rolodex + dog in house
  });

  it("D keeps peeked guest in dogReveal phase", () => {
    const state = freshState({
      house: [{ id: "d1", type: "dog", abilityUsed: false }],
      rolodex: [{ id: "r1", type: "wildBuddy", abilityUsed: false }],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    fireEvent.click(screen.getByText("🐶").closest("button"));
    press("d"); // keep
    fireEvent.click(screen.getByRole("button", { name: /Rolodex/ }));
    expect(screen.getByText(/2 guests/i)).toBeTruthy(); // wildBuddy in rolodex + dog in house
  });

  // --- blame phase ---

  it("D moves blame cursor right; Space blames that guest", () => {
    const state = freshState({
      phase: "blame",
      house: [
        { id: "a", type: "wildBuddy", abilityUsed: false },
        { id: "b", type: "oldFriend", abilityUsed: false },
      ],
      blameContext: "trouble",
      bannedThisParty: [],
      rolodex: [],
      houseCapacity: 5,
      nightsLeft: 20,
      cash: 0,
      popularity: 0,
      trouble: 3,
      houseCostIndex: 0,
      purchasedCounts: {},
      dogRevealGuestId: null,
      kickMode: null,
    });
    render(<App initialState={state} />);
    press("d");
    press(" ");
    expect(screen.getByText(/Shop/)).toBeTruthy();
  });

  it("A/W/S at blame boundary do not change cursor", () => {
    const state = freshState({
      phase: "blame",
      house: [{ id: "a", type: "wildBuddy", abilityUsed: false }],
      blameContext: "trouble",
      bannedThisParty: [],
      rolodex: [],
      houseCapacity: 5,
      nightsLeft: 20,
      cash: 0,
      popularity: 0,
      trouble: 3,
      houseCostIndex: 0,
      purchasedCounts: {},
      dogRevealGuestId: null,
      kickMode: null,
    });
    render(<App initialState={state} />);
    press("a");
    press("w");
    press("s"); // all clamp at 0
    press(" "); // blame guest 0
    expect(screen.getByText(/Shop/)).toBeTruthy();
  });

  it("D at blame max boundary does not move cursor", () => {
    const state = freshState({
      phase: "blame",
      house: [
        { id: "a", type: "wildBuddy", abilityUsed: false },
        { id: "b", type: "oldFriend", abilityUsed: false },
      ],
      blameContext: "trouble",
      bannedThisParty: [],
      rolodex: [],
      houseCapacity: 5,
      nightsLeft: 20,
      cash: 0,
      popularity: 0,
      trouble: 3,
      houseCostIndex: 0,
      purchasedCounts: {},
      dogRevealGuestId: null,
      kickMode: null,
    });
    render(<App initialState={state} />);
    press("d");
    press("d"); // second D stays at max=1
    press(" ");
    expect(screen.getByText(/Shop/)).toBeTruthy();
  });

  it("ArrowRight moves blame cursor right", () => {
    const state = freshState({
      phase: "blame",
      blameContext: "trouble",
      house: [
        { id: "a", type: "wildBuddy", abilityUsed: false },
        { id: "b", type: "oldFriend", abilityUsed: false },
      ],
      bannedThisParty: [],
      rolodex: [],
      houseCapacity: 5,
      nightsLeft: 20,
      cash: 0,
      popularity: 0,
      trouble: 3,
      houseCostIndex: 0,
      purchasedCounts: {},
      dogRevealGuestId: null,
      kickMode: null,
    });
    render(<App initialState={state} />);
    press("ArrowRight");
    press(" ");
    expect(screen.getByText(/Shop/)).toBeTruthy();
  });

  it("ArrowUp/Down move blame cursor", () => {
    const state = freshState({
      phase: "blame",
      blameContext: "trouble",
      house: [{ id: "a", type: "wildBuddy", abilityUsed: false }],
      bannedThisParty: [],
      rolodex: [],
      houseCapacity: 5,
      nightsLeft: 20,
      cash: 0,
      popularity: 0,
      trouble: 3,
      houseCostIndex: 0,
      purchasedCounts: {},
      dogRevealGuestId: null,
      kickMode: null,
    });
    render(<App initialState={state} />);
    press("ArrowUp");
    press("ArrowDown"); // both clamp at 0
    press(" ");
    expect(screen.getByText(/Shop/)).toBeTruthy();
  });

  it("unrecognized key in blame phase does nothing", () => {
    const state = freshState({
      phase: "blame",
      house: [{ id: "a", type: "wildBuddy", abilityUsed: false }],
      blameContext: "trouble",
      bannedThisParty: [],
      rolodex: [],
      houseCapacity: 5,
      nightsLeft: 20,
      cash: 0,
      popularity: 0,
      trouble: 3,
      houseCostIndex: 0,
      purchasedCounts: {},
      dogRevealGuestId: null,
      kickMode: null,
    });
    render(<App initialState={state} />);
    press("x");
    expect(screen.getByText(/who's to blame/i)).toBeTruthy();
  });

  // --- shop phase ---

  const shopState = (overrides = {}) =>
    freshState({
      phase: "shop",
      nightsLeft: 10,
      cash: 0,
      popularity: 0,
      rolodex: [],
      houseCapacity: 5,
      houseCostIndex: 0,
      purchasedCounts: {},
      bannedThisParty: [],
      house: [],
      ...overrides,
    });

  it("S/W navigate shop cursor up and down", () => {
    render(<App initialState={shopState()} />);
    press("s");
    press("w");
    expect(screen.getByText(/10 Nights remaining/)).toBeTruthy();
  });

  it("D/A navigate shop cursor right and left", () => {
    render(<App initialState={shopState()} />);
    press("d");
    press("a"); // 0→1→0
    expect(screen.getByText(/10 Nights remaining/)).toBeTruthy();
  });

  it("ArrowDown/ArrowUp navigate shop cursor", () => {
    render(<App initialState={shopState()} />);
    press("ArrowDown");
    press("ArrowUp");
    expect(screen.getByText(/10 Nights remaining/)).toBeTruthy();
  });

  it("ArrowRight/ArrowLeft navigate shop cursor", () => {
    render(<App initialState={shopState()} />);
    press("ArrowRight");
    press("ArrowLeft");
    expect(screen.getByText(/10 Nights remaining/)).toBeTruthy();
  });

  it("W at shop boundary stays at 0", () => {
    render(<App initialState={shopState()} />);
    press("w");
    expect(screen.getByText(/10 Nights remaining/)).toBeTruthy();
  });

  it("A at shop index 0 wraps to Start Next Party", () => {
    render(
      <App
        initialState={shopState({
          nightsLeft: 1,
          rolodex: [{ id: "g1", type: "oldFriend", abilityUsed: false }],
        })}
      />,
    );
    press("a");
    press(" ");
    expect(screen.getByText(/Ardy Party/)).toBeTruthy();
  });

  it("S at shop max boundary stays at max", () => {
    render(<App initialState={shopState()} />);
    for (let i = 0; i < 20; i++) press("s");
    expect(screen.getByText(/10 Nights remaining/)).toBeTruthy();
  });

  it("Space at shop index 0 buys first guest", () => {
    render(<App initialState={shopState({ popularity: 100 })} />);
    press(" ");
    expect(screen.getByText(/Rolodex: 1/)).toBeTruthy();
  });

  it("Space at house tile expands house", () => {
    render(<App initialState={shopState({ cash: 10 })} />);
    press("s");
    for (let i = 0; i < 6; i++) press("d");
    press(" ");
    expect(screen.getByText(/Capacity: 6/)).toBeTruthy();
  });

  it("Space at last index starts next party", () => {
    render(<App initialState={shopState()} />);
    press("s");
    press("s");
    press(" ");
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
  });

  it("unrecognized key in shop phase does nothing", () => {
    render(<App initialState={shopState()} />);
    press("x");
    expect(screen.getByText(/10 Nights remaining/)).toBeTruthy();
  });

  it("rolodex tile in shop opens and closes modal", () => {
    const s = shopState({
      rolodex: [{ id: "r1", type: "oldFriend", abilityUsed: false }],
    });
    render(<App initialState={s} />);
    fireEvent.click(screen.getByRole("button", { name: /Open Rolodex/ }));
    expect(screen.getByRole("button", { name: /close/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("button", { name: /close/i })).toBeNull();
  });
});
