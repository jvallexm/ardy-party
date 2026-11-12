import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModeSelect from "./ModeSelect.jsx";

describe("ModeSelect", () => {
  it("renders Classic and Test Mode buttons", () => {
    render(<ModeSelect onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /Classic/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Test Mode/ })).toBeTruthy();
  });

  it("calls onSelect with 'classic' when Classic is clicked", () => {
    const cb = vi.fn();
    render(<ModeSelect onSelect={cb} />);
    fireEvent.click(screen.getByRole("button", { name: /Classic/ }));
    expect(cb).toHaveBeenCalledWith("classic");
  });

  it("calls onSelect with 'test' when Test Mode is clicked", () => {
    const cb = vi.fn();
    render(<ModeSelect onSelect={cb} />);
    fireEvent.click(screen.getByRole("button", { name: /Test Mode/ }));
    expect(cb).toHaveBeenCalledWith("test");
  });
});
