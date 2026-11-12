import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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

  it("pressing C selects classic mode", () => {
    const cb = vi.fn();
    render(<ModeSelect onSelect={cb} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "c" })));
    expect(cb).toHaveBeenCalledWith("classic");
  });

  it("pressing T selects test mode", () => {
    const cb = vi.fn();
    render(<ModeSelect onSelect={cb} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" })));
    expect(cb).toHaveBeenCalledWith("test");
  });

  it("pressing uppercase C or T also works", () => {
    const cb = vi.fn();
    render(<ModeSelect onSelect={cb} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "C" })));
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "T" })));
    expect(cb).toHaveBeenCalledWith("classic");
    expect(cb).toHaveBeenCalledWith("test");
  });
});
