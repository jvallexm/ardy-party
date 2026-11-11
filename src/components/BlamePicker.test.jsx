import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BlamePicker from './BlamePicker.jsx';

describe('BlamePicker', () => {
  it('shows all house guests and title', () => {
    const house = [
      { id: 'a', type: 'wildBuddy', abilityUsed: false },
      { id: 'b', type: 'oldFriend', abilityUsed: false },
    ];
    render(<BlamePicker house={house} onBlame={() => {}} context="trouble" />);
    expect(screen.getAllByText(/blame/i).length).toBeGreaterThan(0);
    expect(screen.getByText('🤪')).toBeTruthy();
    expect(screen.getByText('🧑')).toBeTruthy();
  });

  it('calls onBlame with id when tile clicked', () => {
    const cb = vi.fn();
    const house = [{ id: 'a', type: 'wildBuddy', abilityUsed: false }];
    render(<BlamePicker house={house} onBlame={cb} context="trouble" />);
    fireEvent.click(screen.getByText('🤪').closest('button'));
    expect(cb).toHaveBeenCalledWith('a');
  });

  it('applies focused class to guest at focusedIndex', () => {
    const house = [
      { id: 'a', type: 'wildBuddy', abilityUsed: false },
      { id: 'b', type: 'oldFriend', abilityUsed: false },
    ];
    render(<BlamePicker house={house} onBlame={() => {}} context="trouble" focusedIndex={1} />);
    const tiles = screen.getAllByRole('button').filter((b) => b.classList.contains('tile'));
    expect(tiles[0].classList.contains('focused')).toBe(false);
    expect(tiles[1].classList.contains('focused')).toBe(true);
  });

  it('shows overcapacity context message', () => {
    render(<BlamePicker house={[]} onBlame={() => {}} context="overcapacity" />);
    expect(screen.getByText(/overcapacity|over capacity/i)).toBeTruthy();
  });
});
