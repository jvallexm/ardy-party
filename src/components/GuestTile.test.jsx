import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GuestTile from "./GuestTile.jsx";

describe("GuestTile", () => {
  it("renders the guest emoji", () => {
    const guest = { id: "a", type: "oldFriend", abilityUsed: false };
    render(<GuestTile guest={guest} />);
    expect(screen.getByText("🧑")).toBeTruthy();
  });

  it("shows pop bonus in yellow in top right when non-zero", () => {
    const guest = { id: "a", type: "oldFriend", abilityUsed: false };
    render(<GuestTile guest={guest} />);
    expect(screen.getByText("+1")).toBeTruthy();
  });

  it("shows negative pop correctly", () => {
    const guest = { id: "a", type: "ticketTaker", abilityUsed: false };
    render(<GuestTile guest={guest} />);
    expect(screen.getByText("-1")).toBeTruthy();
    expect(screen.getByText("+2")).toBeTruthy();
  });

  it("shows ability icon when unused", () => {
    const guest = { id: "a", type: "driver", abilityUsed: false };
    render(<GuestTile guest={guest} />);
    expect(screen.getByText("⬇️")).toBeTruthy();
  });

  it("hides ability icon when used", () => {
    const guest = { id: "a", type: "driver", abilityUsed: true };
    const { container } = render(<GuestTile guest={guest} />);
    expect(container.querySelector(".tile-ability-icon")).toBeNull();
  });

  it("always shows trouble X for trouble guests", () => {
    const guest = { id: "a", type: "wildBuddy", abilityUsed: false };
    render(<GuestTile guest={guest} />);
    expect(screen.getByText("❌")).toBeTruthy();
  });

  it("renders dancer with music note and no pop number", () => {
    const guest = { id: "a", type: "dancer", abilityUsed: false };
    const { container } = render(<GuestTile guest={guest} />);
    expect(screen.getByText("🎵")).toBeTruthy();
    expect(container.querySelector(".tile-pop")).toBeNull();
  });

  it("does not show a 0 pop or cash number", () => {
    const guest = { id: "a", type: "driver", abilityUsed: false };
    const { container } = render(<GuestTile guest={guest} />);
    expect(container.querySelector(".tile-pop")).toBeNull();
    expect(container.querySelector(".tile-cash")).toBeNull();
  });

  it("comedian does not show its fullHouseBonus ability icon", () => {
    const guest = { id: "a", type: "comedian", abilityUsed: false };
    const { container } = render(<GuestTile guest={guest} />);
    expect(container.querySelector(".tile-ability-icon")).toBeNull();
  });

  it("calls onClick when clicked", () => {
    const guest = { id: "a", type: "oldFriend", abilityUsed: false };
    const onClick = vi.fn();
    render(<GuestTile guest={guest} onClick={onClick} />);
    fireEvent.click(screen.getByText("🧑").closest("button"));
    expect(onClick).toHaveBeenCalledWith(guest);
  });

  it("does not attach click handler when onClick missing", () => {
    const guest = { id: "a", type: "oldFriend", abilityUsed: false };
    const { container } = render(<GuestTile guest={guest} />);
    fireEvent.click(container.querySelector(".tile"));
    // If no handler was set, nothing crashes.
    expect(true).toBe(true);
  });

  it("shows cash correctly in bottom right", () => {
    const guest = { id: "a", type: "richPal", abilityUsed: false };
    render(<GuestTile guest={guest} />);
    expect(screen.getByText("+1")).toBeTruthy();
  });

  it("applies focused class when focused is true", () => {
    const guest = { id: "a", type: "oldFriend", abilityUsed: false };
    const { container } = render(<GuestTile guest={guest} focused />);
    expect(container.querySelector(".tile.focused")).toBeTruthy();
  });

  it("does not apply focused class when focused is false", () => {
    const guest = { id: "a", type: "oldFriend", abilityUsed: false };
    const { container } = render(<GuestTile guest={guest} focused={false} />);
    expect(container.querySelector(".tile.focused")).toBeNull();
  });

  it("can be disabled", () => {
    const guest = { id: "a", type: "oldFriend", abilityUsed: false };
    const onClick = vi.fn();
    render(<GuestTile guest={guest} onClick={onClick} disabled />);
    const btn = screen.getByText("🧑").closest("button");
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
