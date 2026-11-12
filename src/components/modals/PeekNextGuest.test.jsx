import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PeekNextGuest from "./PeekNextGuest.jsx";

describe("PeekNextGuest", () => {
  it("shows guest preview and buttons", () => {
    const guest = { id: "r1", type: "wildBuddy", abilityUsed: false };
    render(<PeekNextGuest guest={guest} onChoose={() => {}} />);
    expect(screen.getByText("🤪")).toBeTruthy();
    expect(screen.getByRole("button", { name: /boot/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /keep/i })).toBeTruthy();
  });

  it('calls onChoose("boot") when boot clicked', () => {
    const cb = vi.fn();
    const guest = { id: "r1", type: "wildBuddy", abilityUsed: false };
    render(<PeekNextGuest guest={guest} onChoose={cb} />);
    fireEvent.click(screen.getByRole("button", { name: /boot/i }));
    expect(cb).toHaveBeenCalledWith("boot");
  });

  it('calls onChoose("keep") when keep clicked', () => {
    const cb = vi.fn();
    const guest = { id: "r1", type: "wildBuddy", abilityUsed: false };
    render(<PeekNextGuest guest={guest} onChoose={cb} />);
    fireEvent.click(screen.getByRole("button", { name: /keep/i }));
    expect(cb).toHaveBeenCalledWith("keep");
  });

  it("renders nothing when no guest", () => {
    const { container } = render(
      <PeekNextGuest guest={null} onChoose={() => {}} />,
    );
    expect(container.querySelector(".dog-reveal")).toBeNull();
  });
});
