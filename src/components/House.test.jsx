import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import House from './House.jsx';

const baseState = () => ({
  house: [],
  houseCapacity: 5,
  rolodex: [{ id: 'r1', type: 'oldFriend', abilityUsed: false }],
  bannedThisParty: [],
});

describe('House', () => {
  it('renders rolodex button and door button', () => {
    render(<House state={baseState()} />);
    expect(screen.getByRole('button', { name: /Rolodex/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Door/ })).toBeTruthy();
  });

  it('shows guest tiles for each guest in house', () => {
    const state = baseState();
    state.house = [{ id: 'g1', type: 'oldFriend', abilityUsed: false }];
    render(<House state={state} />);
    expect(screen.getByText('🧑')).toBeTruthy();
  });

  it('shows empty tiles up to capacity', () => {
    const state = baseState();
    state.houseCapacity = 5;
    const { container } = render(<House state={state} />);
    expect(container.querySelectorAll('.tile.empty').length).toBe(5);
  });

  it('calls onOpenRolodex when rolodex button clicked', () => {
    const cb = vi.fn();
    render(<House state={baseState()} onOpenRolodex={cb} />);
    fireEvent.click(screen.getByRole('button', { name: /Rolodex/ }));
    expect(cb).toHaveBeenCalled();
  });

  it('calls onDoor when door clicked', () => {
    const cb = vi.fn();
    render(<House state={baseState()} onDoor={cb} />);
    fireEvent.click(screen.getByRole('button', { name: /Door/ }));
    expect(cb).toHaveBeenCalled();
  });

  it('disables door if rolodex empty', () => {
    const state = baseState();
    state.rolodex = [];
    render(<House state={state} />);
    expect(screen.getByRole('button', { name: /Door/ }).disabled).toBe(true);
  });

  it('disables door if house full', () => {
    const state = baseState();
    state.house = Array.from({ length: 5 }, (_, i) => ({
      id: `g${i}`,
      type: 'oldFriend',
      abilityUsed: false,
    }));
    render(<House state={state} />);
    expect(screen.getByRole('button', { name: /Door/ }).disabled).toBe(true);
  });

  it('disables door if all rolodex guests are banned', () => {
    const state = baseState();
    state.rolodex = [{ id: 'b1', type: 'oldFriend', abilityUsed: false }];
    state.bannedThisParty = ['b1'];
    render(<House state={state} />);
    expect(screen.getByRole('button', { name: /Door/ }).disabled).toBe(true);
  });

  it('applies focused class to rolodex tile at index 0', () => {
    render(<House state={baseState()} focusedTileIndex={0} />);
    expect(screen.getByRole('button', { name: /Rolodex/ }).classList.contains('focused')).toBe(true);
  });

  it('applies focused class to door tile at index 1', () => {
    render(<House state={baseState()} focusedTileIndex={1} />);
    expect(screen.getByRole('button', { name: /Door/ }).classList.contains('focused')).toBe(true);
  });

  it('applies focused class to guest tile at matching index', () => {
    const state = { ...baseState(), house: [{ id: 'g1', type: 'oldFriend', abilityUsed: false }] };
    render(<House state={state} focusedTileIndex={2} />);
    expect(screen.getByText('🧑').closest('button').classList.contains('focused')).toBe(true);
  });

  it('applies focused class to empty tile at matching index', () => {
    const { container } = render(<House state={baseState()} focusedTileIndex={2} />);
    const emptyTiles = container.querySelectorAll('.tile.empty');
    expect(emptyTiles[0].classList.contains('focused')).toBe(true);
    expect(emptyTiles[1].classList.contains('focused')).toBe(false);
  });

  it('clicking a guest tile fires onGuestClick', () => {
    const state = baseState();
    const g = { id: 'g1', type: 'driver', abilityUsed: false };
    state.house = [g];
    const cb = vi.fn();
    render(<House state={state} onGuestClick={cb} />);
    fireEvent.click(screen.getByText('🚗').closest('button'));
    expect(cb).toHaveBeenCalledWith(g);
  });
});
