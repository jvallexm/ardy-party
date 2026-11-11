import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App.jsx';
import { createInitialState } from './lib/gameState.js';

// Stable ids so we can find specific guests.
let idCounter = 0;
beforeEach(() => {
  idCounter = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => `u-${++idCounter}`,
  });
});

function freshState(overrides = {}) {
  return { ...createInitialState({ shuffleFn: (a) => a }), ...overrides };
}

describe('App - basic flow', () => {
  it('renders HUD and House initially', () => {
    render(<App />);
    expect(screen.getByText(/Ardy Party/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Rolodex/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Door/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /End Party/ })).toBeTruthy();
  });

  it('opens and closes the rolodex modal', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Rolodex/ }));
    expect(screen.getByText(/10 guests/i)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('close'));
    expect(screen.queryByText(/10 guests/i)).toBeNull();
  });

  it('door is disabled when all rolodex guests are banned', () => {
    const state = freshState({
      rolodex: [{ id: 'b1', type: 'oldFriend', abilityUsed: false }],
      bannedThisParty: ['b1'],
    });
    render(<App initialState={state} />);
    expect(screen.getByRole('button', { name: /Door/ }).disabled).toBe(true);
  });

  it('door button adds a guest to the house', () => {
    render(<App initialState={freshState()} />);
    fireEvent.click(screen.getByRole('button', { name: /Door/ }));
    expect(screen.getAllByText('🧑').length).toBeGreaterThan(0);
  });

  it('end party flow reaches shop and can start next party', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Door/ }));
    fireEvent.click(screen.getByRole('button', { name: /End Party/ }));
    fireEvent.click(screen.getByRole('button', { name: /Go to Shop/ }));
    expect(screen.getByText(/Shop/)).toBeTruthy();
    expect(screen.getByText(/23 Nights remaining/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Start Next Party/ }));
    expect(screen.getByRole('button', { name: /End Party/ })).toBeTruthy();
  });

  it('can buy a guest in the shop', () => {
    render(<App initialState={freshState()} />);
    fireEvent.click(screen.getByRole('button', { name: /Door/ })); // oldFriend +1 pop
    fireEvent.click(screen.getByRole('button', { name: /Door/ })); // oldFriend +1
    fireEvent.click(screen.getByRole('button', { name: /End Party/ }));
    fireEvent.click(screen.getByRole('button', { name: /Go to Shop/ }));
    const buyBtn = screen.getByRole('button', { name: /Old Friend/ });
    expect(buyBtn.disabled).toBe(false);
    fireEvent.click(buyBtn);
    expect(screen.getByText(/Rolodex: 11/)).toBeTruthy();
  });

  it('can expand the house in the shop', () => {
    render(<App initialState={freshState({ phase: 'shop', cash: 2, nightsLeft: 10 })} />);
    expect(screen.getByText(/Capacity: 5/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Expand House.*\$2/ }));
    expect(screen.getByText(/Capacity: 6/)).toBeTruthy();
  });

  it('clicking a non-ability guest tile does nothing', () => {
    render(<App initialState={freshState()} />);
    fireEvent.click(screen.getByRole('button', { name: /Door/ }));
    const tile = screen.getAllByText('🧑')[0].closest('button');
    fireEvent.click(tile);
    // No crash; house still has the old friend
    expect(screen.getAllByText('🧑').length).toBeGreaterThan(0);
  });
});

describe('App - ability and blame integration', () => {
  it('blame picker shows after 3 trouble and resolves to shop', () => {
    // Pre-build a state with 3 wild buddies in house
    const state = freshState({
      house: [
        { id: 'w1', type: 'wildBuddy', abilityUsed: false },
        { id: 'w2', type: 'wildBuddy', abilityUsed: false },
      ],
      trouble: 2,
      rolodex: [{ id: 'w3', type: 'wildBuddy', abilityUsed: false }],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    fireEvent.click(screen.getByRole('button', { name: /Door/ }));
    // Now in blame phase
    const wildTile = screen.getAllByText('🤪')[0].closest('button');
    fireEvent.click(wildTile);
    expect(screen.getByText(/Shop/)).toBeTruthy();
  });

  it('driver ability opens rolodex pick mode and invites chosen guest', () => {
    const state = freshState({
      house: [{ id: 'd1', type: 'driver', abilityUsed: false }],
      rolodex: [{ id: 'f1', type: 'oldFriend', abilityUsed: false, order: 0 }],
      houseCapacity: 5,
      bannedThisParty: [],
    });
    render(<App initialState={state} />);
    fireEvent.click(screen.getByText('🚗').closest('button'));
    expect(screen.getByText(/Pick a Guest to Invite/)).toBeTruthy();
    fireEvent.click(screen.getByText('🧑').closest('button'));
    expect(screen.queryByText(/Pick a Guest to Invite/)).toBeNull();
    expect(screen.getByText('🧑')).toBeTruthy();
  });

  it('closing rolodex while in driver mode cancels driver mode', () => {
    const state = freshState({
      house: [{ id: 'd1', type: 'driver', abilityUsed: false }],
      rolodex: [{ id: 'f1', type: 'oldFriend', abilityUsed: false, order: 0 }],
      houseCapacity: 5,
      bannedThisParty: [],
    });
    render(<App initialState={state} />);
    fireEvent.click(screen.getByText('🚗').closest('button'));
    expect(screen.getByText(/Pick a Guest to Invite/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText(/Pick a Guest to Invite/)).toBeNull();
  });

  it('security guard sets kickMode and clicking a target kicks them', () => {
    const state = freshState({
      house: [
        { id: 'g1', type: 'securityGuard', abilityUsed: false },
        { id: 't1', type: 'wildBuddy', abilityUsed: false },
      ],
      trouble: 1,
      rolodex: [],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    const guardTile = screen.getByText('💂').closest('button');
    fireEvent.click(guardTile);
    expect(screen.getByText(/kick/i)).toBeTruthy();
    const targetTile = screen.getByText('🤪').closest('button');
    fireEvent.click(targetTile);
    // Target gone from house
    expect(screen.queryByText('🤪')).toBeNull();
  });

  it('dog ability shows DogReveal and keep leaves rolodex intact', () => {
    const state = freshState({
      house: [{ id: 'd1', type: 'dog', abilityUsed: false }],
      rolodex: [{ id: 'r1', type: 'oldFriend', abilityUsed: false }],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    const dogTile = screen.getByText('🐶').closest('button');
    fireEvent.click(dogTile);
    expect(screen.getByText(/Peek/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Keep/ }));
    // Back to party phase, rolodex still has 1
    expect(screen.queryByText(/Peek/)).toBeNull();
  });

  it('dog ability with boot removes guest from rolodex', () => {
    const state = freshState({
      house: [{ id: 'd1', type: 'dog', abilityUsed: false }],
      rolodex: [{ id: 'r1', type: 'wildBuddy', abilityUsed: false }],
      houseCapacity: 5,
    });
    render(<App initialState={state} />);
    const dogTile = screen.getByText('🐶').closest('button');
    fireEvent.click(dogTile);
    fireEvent.click(screen.getByRole('button', { name: /Boot/ }));
    fireEvent.click(screen.getByRole('button', { name: /Rolodex/ }));
    expect(screen.getByText(/1 guest/i)).toBeTruthy(); // dog still in house
  });
});
