import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GameOver from "./GameOver.jsx";

describe("GameOver", () => {
  it("renders game over title and 24 nights message", () => {
    render(<GameOver state={{ popularity: 42, cash: 7 }} />);
    expect(screen.getByText(/Game Over/)).toBeTruthy();
    expect(screen.getByText(/24 nights complete/)).toBeTruthy();
  });

  it("shows final popularity and cash", () => {
    render(<GameOver state={{ popularity: 42, cash: 7 }} />);
    expect(screen.getByText(/Final pop: 42 \| Cash: 7/)).toBeTruthy();
  });
});
