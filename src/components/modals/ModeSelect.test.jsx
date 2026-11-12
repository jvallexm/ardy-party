import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ModeSelect from "./ModeSelect.jsx";

describe("ModeSelect — layout", () => {
  it("renders all four buttons immediately", () => {
    render(<ModeSelect onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /Scenario 1/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Scenario 2/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Classic/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Test Mode/ })).toBeTruthy();
  });

  it("Classic and Test Mode are disabled before a scenario is selected", () => {
    render(<ModeSelect onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /Classic/ }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: /Test Mode/ }).disabled).toBe(
      true,
    );
  });

  it("Scenario buttons are never disabled", () => {
    render(<ModeSelect onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /Scenario 1/ }).disabled).toBe(
      false,
    );
    expect(screen.getByRole("button", { name: /Scenario 2/ }).disabled).toBe(
      false,
    );
  });
});

describe("ModeSelect — scenario selection", () => {
  it("clicking Scenario 1 enables mode buttons", () => {
    render(<ModeSelect onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Scenario 1/ }));
    expect(screen.getByRole("button", { name: /Classic/ }).disabled).toBe(
      false,
    );
    expect(screen.getByRole("button", { name: /Test Mode/ }).disabled).toBe(
      false,
    );
  });

  it("clicking Scenario 2 enables mode buttons", () => {
    render(<ModeSelect onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Scenario 2/ }));
    expect(screen.getByRole("button", { name: /Classic/ }).disabled).toBe(
      false,
    );
  });

  it("pressing 1 enables mode buttons for scenario 1", () => {
    render(<ModeSelect onSelect={() => {}} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" })));
    expect(screen.getByRole("button", { name: /Classic/ }).disabled).toBe(
      false,
    );
  });

  it("pressing 2 enables mode buttons for scenario 2", () => {
    render(<ModeSelect onSelect={() => {}} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "2" })));
    expect(screen.getByRole("button", { name: /Classic/ }).disabled).toBe(
      false,
    );
  });
});

describe("ModeSelect — mode selection", () => {
  function selectScenario(scenario = "s1") {
    const cb = vi.fn();
    render(<ModeSelect onSelect={cb} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: scenario === "s1" ? /Scenario 1/ : /Scenario 2/,
      }),
    );
    return cb;
  }

  it("clicking Classic after scenario 1 calls onSelect correctly", () => {
    const cb = selectScenario("s1");
    fireEvent.click(screen.getByRole("button", { name: /Classic/ }));
    expect(cb).toHaveBeenCalledWith({ scenario: "s1", mode: "classic" });
  });

  it("clicking Test Mode after scenario 1 calls onSelect correctly", () => {
    const cb = selectScenario("s1");
    fireEvent.click(screen.getByRole("button", { name: /Test Mode/ }));
    expect(cb).toHaveBeenCalledWith({ scenario: "s1", mode: "test" });
  });

  it("clicking Classic after scenario 2 calls onSelect correctly", () => {
    const cb = selectScenario("s2");
    fireEvent.click(screen.getByRole("button", { name: /Classic/ }));
    expect(cb).toHaveBeenCalledWith({ scenario: "s2", mode: "classic" });
  });

  it("pressing c after selecting scenario 1 calls onSelect with classic", () => {
    const cb = selectScenario("s1");
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "c" })));
    expect(cb).toHaveBeenCalledWith({ scenario: "s1", mode: "classic" });
  });

  it("pressing t after selecting scenario 1 calls onSelect with test", () => {
    const cb = selectScenario("s1");
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" })));
    expect(cb).toHaveBeenCalledWith({ scenario: "s1", mode: "test" });
  });

  it("pressing c before any scenario is selected does nothing", () => {
    const cb = vi.fn();
    render(<ModeSelect onSelect={cb} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "c" })));
    expect(cb).not.toHaveBeenCalled();
  });
});
