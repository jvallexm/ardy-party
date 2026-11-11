import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Shop from "./Shop.jsx";
import { SHOP_GUESTS, GUEST_TYPES } from "../lib/guests.js";

const baseState = (overrides = {}) => ({
  nightsLeft: 20,
  cash: 10,
  popularity: 20,
  rolodex: [{ id: "r1", type: "oldFriend", abilityUsed: false }],
  houseCapacity: 5,
  houseCostIndex: 0,
  purchasedCounts: {},
  ...overrides,
});

describe("Shop", () => {
  it("shows title with night and rolodex count", () => {
    render(
      <Shop
        state={baseState()}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText(/20 Nights remaining/)).toBeTruthy();
    expect(screen.getByText(/Rolodex: 1/)).toBeTruthy();
  });

  it("renders a tile for each shop guest", () => {
    render(
      <Shop
        state={baseState()}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    SHOP_GUESTS.forEach((key) => {
      expect(screen.getByText(GUEST_TYPES[key].name)).toBeTruthy();
    });
  });

  it("renders house tile with capacity and cost", () => {
    render(
      <Shop
        state={baseState({ cash: 10, houseCostIndex: 0 })}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText(/Capacity: 5/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Expand House.*\$2/ }),
    ).toBeTruthy();
  });

  it("disables house tile when cash too low", () => {
    render(
      <Shop
        state={baseState({ cash: 0 })}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Expand House/ }).disabled).toBe(
      true,
    );
  });

  it("disables house tile when at max capacity", () => {
    render(
      <Shop
        state={baseState({ cash: 30, houseCapacity: 34 })}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Expand House/ }).disabled).toBe(
      true,
    );
  });

  it("calls onExpand when house tile clicked", () => {
    const cb = vi.fn();
    render(
      <Shop
        state={baseState({ cash: 10 })}
        onBuy={() => {}}
        onExpand={cb}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Expand House/ }));
    expect(cb).toHaveBeenCalled();
  });

  it("disables guest tile when popularity too low", () => {
    render(
      <Shop
        state={baseState({ popularity: 0 })}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    const oldFriendBtn = screen.getByRole("button", { name: /Old Friend/ });
    expect(oldFriendBtn.disabled).toBe(true);
  });

  it("disables guest tile when at max purchase", () => {
    render(
      <Shop
        state={baseState({
          popularity: 100,
          purchasedCounts: { oldFriend: 4 },
        })}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Old Friend/ }).disabled).toBe(
      true,
    );
  });

  it("calls onBuy with guest type when tile clicked", () => {
    const cb = vi.fn();
    render(
      <Shop
        state={baseState({ popularity: 100 })}
        onBuy={cb}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Old Friend/ }));
    expect(cb).toHaveBeenCalledWith("oldFriend");
  });

  it("calls onOpenRolodex when rolodex tile clicked", () => {
    const cb = vi.fn();
    render(
      <Shop
        state={baseState()}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
        onOpenRolodex={cb}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Open Rolodex/ }));
    expect(cb).toHaveBeenCalled();
  });

  it("shows pop and cash stats", () => {
    render(
      <Shop
        state={baseState({ popularity: 15, cash: 7 })}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText(/Pop: 15\/60/)).toBeTruthy();
    expect(screen.getByText(/Cash: 7\/30/)).toBeTruthy();
  });

  it("shows Start Next Party when nightsLeft > 0", () => {
    render(
      <Shop
        state={baseState({ nightsLeft: 5 })}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Start Next Party/ }),
    ).toBeTruthy();
  });

  it("shows Game Over when nightsLeft is 0", () => {
    render(
      <Shop
        state={baseState({ nightsLeft: 0 })}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText(/Game Over/)).toBeTruthy();
  });

  it("calls onNext when Start Next Party clicked", () => {
    const cb = vi.fn();
    render(
      <Shop
        state={baseState()}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={cb}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Start Next Party/ }));
    expect(cb).toHaveBeenCalled();
  });

  it("applies focused class to guest tile at matching focusedIndex", () => {
    const { container } = render(
      <Shop
        state={baseState()}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
        focusedIndex={1}
      />,
    );
    const tiles = container.querySelectorAll(".shop-tile");
    expect(tiles[0].classList.contains("focused")).toBe(false);
    expect(tiles[1].classList.contains("focused")).toBe(true);
  });

  it("applies focused class to house tile at SHOP_GUESTS.length index", () => {
    render(
      <Shop
        state={baseState()}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
        focusedIndex={SHOP_GUESTS.length}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: /Expand House/ })
        .classList.contains("focused"),
    ).toBe(true);
  });

  it("applies focused class to Start Next Party at last focusedIndex", () => {
    render(
      <Shop
        state={baseState()}
        onBuy={() => {}}
        onExpand={() => {}}
        onNext={() => {}}
        focusedIndex={SHOP_GUESTS.length + 1}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: /Start Next Party/ })
        .classList.contains("focused"),
    ).toBe(true);
  });
});
