import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WinScreen from "./WinScreen.jsx";

const baseState = (overrides = {}) => ({
  nightsLeft: 18,
  popularity: 45,
  cash: 12,
  ...overrides,
});

describe("WinScreen", () => {
  it("renders win message and star icons", () => {
    render(<WinScreen state={baseState()} />);
    expect(screen.getByText(/4-star party achieved/)).toBeTruthy();
    expect(screen.getByText(/⭐⭐⭐⭐/)).toBeTruthy();
  });

  it("shows the night reached and final stats", () => {
    render(
      <WinScreen
        state={baseState({ nightsLeft: 18, popularity: 45, cash: 12 })}
      />,
    );
    expect(screen.getByText(/Night 6 of 24/)).toBeTruthy();
    expect(screen.getByText(/pop: 45/i)).toBeTruthy();
    expect(screen.getByText(/cash: 12/i)).toBeTruthy();
  });
});
