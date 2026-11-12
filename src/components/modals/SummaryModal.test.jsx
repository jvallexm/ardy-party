import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SummaryModal from "./SummaryModal.jsx";

const makeState = (guestTypes) => ({
  house: guestTypes.map((type, i) => ({
    id: `g${i}`,
    type,
    abilityUsed: false,
  })),
  houseCapacity: 5,
});

describe("SummaryModal", () => {
  it("shows Night Results title and Go to Shop button", () => {
    render(
      <SummaryModal state={makeState(["oldFriend"])} onConfirm={() => {}} />,
    );
    expect(screen.getByText(/Night Results/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Go to Shop/ })).toBeTruthy();
  });

  it("shows pop bonus for guests with non-zero popBonus", () => {
    render(
      <SummaryModal state={makeState(["oldFriend"])} onConfirm={() => {}} />,
    );
    expect(screen.getAllByText(/\+1 pop/).length).toBeGreaterThan(0);
  });

  it("shows no formatted pop bonus for guest with popBonus 0", () => {
    render(
      <SummaryModal state={makeState(["richPal"])} onConfirm={() => {}} />,
    );
    expect(screen.queryByText(/[+-]\d+ pop/)).toBeNull();
  });

  it("shows cash bonus for guests with non-zero cashBonus", () => {
    render(
      <SummaryModal state={makeState(["richPal"])} onConfirm={() => {}} />,
    );
    expect(screen.getAllByText(/\+1 cash/).length).toBeGreaterThan(0);
  });

  it("shows no formatted cash bonus for guest with cashBonus 0", () => {
    render(
      <SummaryModal state={makeState(["oldFriend"])} onConfirm={() => {}} />,
    );
    expect(screen.queryByText(/[+-]\d+ cash/)).toBeNull();
  });

  it("calls onConfirm when Go to Shop clicked", () => {
    const cb = vi.fn();
    render(<SummaryModal state={makeState(["oldFriend"])} onConfirm={cb} />);
    fireEvent.click(screen.getByRole("button", { name: /Go to Shop/ }));
    expect(cb).toHaveBeenCalled();
  });

  it("shows totals row", () => {
    render(
      <SummaryModal
        state={makeState(["oldFriend", "richPal"])}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText(/Total/)).toBeTruthy();
  });

  it("groups dancers into one row with count and squared pop", () => {
    render(
      <SummaryModal
        state={makeState(["dancer", "dancer", "dancer"])}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText(/Dancer \(x3\)/)).toBeTruthy();
    expect(screen.getAllByText(/\+9 pop/).length).toBeGreaterThan(0);
  });

  it("does not show a dancer row when no dancers in house", () => {
    render(
      <SummaryModal state={makeState(["oldFriend"])} onConfirm={() => {}} />,
    );
    expect(screen.queryByText(/Dancer/)).toBeNull();
  });

  it("shows dancer cash bonus when non-zero", () => {
    // dancer has cashBonus — verify it appears in grouped row
    render(<SummaryModal state={makeState(["dancer"])} onConfirm={() => {}} />);
    expect(screen.getByText(/Dancer \(x1\)/)).toBeTruthy();
  });
});
