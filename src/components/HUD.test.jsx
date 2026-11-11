import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HUD from './HUD.jsx';

describe('HUD', () => {
  const baseState = {
    nightsLeft: 24,
    cash: 5,
    popularity: 10,
    trouble: 1,
    house: [],
    houseCapacity: 5,
  };

  it('displays cash, pop, and nights remaining', () => {
    render(<HUD state={baseState} onEndParty={() => {}} />);
    expect(screen.getByText(/Pop: 10\/60/)).toBeTruthy();
    expect(screen.getByText(/Cash: 5\/30/)).toBeTruthy();
    expect(screen.getByText(/Nights: 24/)).toBeTruthy();
  });

  it('renders 3 trouble slots', () => {
    const { container } = render(<HUD state={baseState} onEndParty={() => {}} />);
    expect(container.querySelectorAll('.trouble-x')).toHaveLength(3);
  });

  it('marks active trouble slots based on trouble count', () => {
    const { container } = render(<HUD state={baseState} onEndParty={() => {}} />);
    const slots = container.querySelectorAll('.trouble-x');
    expect(slots[0].classList.contains('off')).toBe(false);
    expect(slots[1].classList.contains('off')).toBe(true);
    expect(slots[2].classList.contains('off')).toBe(true);
  });

  it('shows no active trouble slots when trouble is 0', () => {
    const { container } = render(<HUD state={{ ...baseState, trouble: 0 }} onEndParty={() => {}} />);
    const slots = container.querySelectorAll('.trouble-x');
    slots.forEach((s) => expect(s.classList.contains('off')).toBe(true));
  });

  it('shows all active trouble slots when trouble is 3', () => {
    const { container } = render(<HUD state={{ ...baseState, trouble: 3 }} onEndParty={() => {}} />);
    const slots = container.querySelectorAll('.trouble-x');
    slots.forEach((s) => expect(s.classList.contains('off')).toBe(false));
  });

  it('renders 4 star slots', () => {
    const { container } = render(<HUD state={baseState} onEndParty={() => {}} />);
    expect(container.querySelectorAll('.star')).toHaveLength(4);
  });

  it('highlights stars based on guests in house', () => {
    const state = {
      ...baseState,
      house: [
        { id: 'a', type: 'alien', abilityUsed: false },
        { id: 'b', type: 'oldFriend', abilityUsed: false },
      ],
    };
    const { container } = render(<HUD state={state} onEndParty={() => {}} />);
    const stars = container.querySelectorAll('.star');
    expect(stars[0].classList.contains('off')).toBe(false);
    expect(stars[1].classList.contains('off')).toBe(true);
  });

  it('calls onEndParty when End Party is clicked', () => {
    const onEndParty = vi.fn();
    render(<HUD state={baseState} onEndParty={onEndParty} />);
    fireEvent.click(screen.getByRole('button', { name: /End Party/ }));
    expect(onEndParty).toHaveBeenCalledOnce();
  });

  it('applies focused class to End Party when endPartyFocused', () => {
    render(<HUD state={baseState} onEndParty={() => {}} endPartyFocused />);
    expect(screen.getByRole('button', { name: /End Party/ }).classList.contains('focused')).toBe(true);
  });
});
