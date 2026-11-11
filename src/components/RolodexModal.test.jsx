import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RolodexModal from "./RolodexModal.jsx";

describe("RolodexModal", () => {
  it("shows nothing when closed", () => {
    const { container } = render(
      <RolodexModal open={false} rolodex={[]} onClose={() => {}} />,
    );
    expect(container.querySelector(".modal")).toBeNull();
  });

  it("shows guest tiles and count when open", () => {
    const rolodex = [
      { id: "a", type: "oldFriend", abilityUsed: false },
      { id: "b", type: "richPal", abilityUsed: false },
    ];
    render(<RolodexModal open rolodex={rolodex} onClose={() => {}} />);
    expect(screen.getByText("🧑")).toBeTruthy();
    expect(screen.getByText("💰")).toBeTruthy();
    expect(screen.getByText(/2 guest/i)).toBeTruthy();
  });

  it('shows singular "guest" (no s) when count is 1', () => {
    const rolodex = [{ id: "a", type: "oldFriend", abilityUsed: false }];
    render(<RolodexModal open rolodex={rolodex} onClose={() => {}} />);
    expect(screen.getByText(/1 guest\b/)).toBeTruthy();
  });

  it("calls onClose when X clicked", () => {
    const cb = vi.fn();
    render(<RolodexModal open rolodex={[]} onClose={cb} />);
    fireEvent.click(screen.getByLabelText("close"));
    expect(cb).toHaveBeenCalled();
  });
});
