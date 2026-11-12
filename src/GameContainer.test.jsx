import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GameContainer from "./GameContainer.jsx";

let idCounter = 0;
beforeEach(() => {
  idCounter = 0;
  vi.stubGlobal("crypto", { randomUUID: () => `u-${++idCounter}` });
});

describe("GameContainer", () => {
  it("shows mode selection screen initially", () => {
    render(<GameContainer />);
    expect(screen.getByRole("button", { name: /Classic/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Test Mode/ })).toBeTruthy();
  });

  it("clicking Classic replaces mode select with the game", () => {
    render(<GameContainer />);
    fireEvent.click(screen.getByRole("button", { name: /Classic/ }));
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Classic/ })).toBeNull();
  });

  it("clicking Test Mode replaces mode select with the game", () => {
    render(<GameContainer />);
    fireEvent.click(screen.getByRole("button", { name: /Test Mode/ }));
    expect(screen.getByRole("button", { name: /End Party/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Test Mode/ })).toBeNull();
  });

  it("test mode shop has fewer items than classic shop", () => {
    const { unmount } = render(<GameContainer />);
    fireEvent.click(screen.getByRole("button", { name: /Classic/ }));
    fireEvent.click(screen.getByRole("button", { name: /End Party/ }));
    fireEvent.click(screen.getByRole("button", { name: /Go to Shop/ }));
    const classicTileCount = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("shop-tile")).length;
    unmount();

    render(<GameContainer />);
    fireEvent.click(screen.getByRole("button", { name: /Test Mode/ }));
    fireEvent.click(screen.getByRole("button", { name: /End Party/ }));
    fireEvent.click(screen.getByRole("button", { name: /Go to Shop/ }));
    const testTileCount = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("shop-tile")).length;

    expect(testTileCount).toBeLessThan(classicTileCount);
  });
});
