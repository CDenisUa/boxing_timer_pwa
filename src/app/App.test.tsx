// Core
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
// App
import App from '@/app/App';
// Engine
import { TimerSnapshot } from '@/engine/timerEngine';
// Storage
import { runStateStorage } from '@/storage/runStateStorage';
import { sessionsStorage } from '@/storage/sessionsStorage';
// Test
import { makeSession } from '@/test/utils';

describe('App navigation flow', () => {
  it('shows the empty state, then creates and runs a program end-to-end', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByText('No programs found')).toBeInTheDocument());

    // Create a program.
    await user.click(screen.getByRole('button', { name: 'Create program' }));
    expect(screen.getByRole('heading', { name: 'New workout' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Heavy Bag Drill'), 'Morning Rounds');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Back on the list, the new card appears.
    await waitFor(() => expect(screen.getByText('Morning Rounds')).toBeInTheDocument());

    // Start it.
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByText('LIVE SESSION')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  });

  it('navigates to settings and back', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('No programs found')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Programs' })).toBeInTheDocument());
  });

  it('filters and searches the saved programs', async () => {
    const user = userEvent.setup();
    await sessionsStorage.saveAll([
      makeSession({ id: '1', name: 'Boxing A', category: 'boxing' }),
      makeSession({ id: '2', name: 'Run B', category: 'running' }),
    ]);
    render(<App />);

    await waitFor(() => expect(screen.getByText('Boxing A')).toBeInTheDocument());
    expect(screen.getByText('Run B')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Running' }));
    expect(screen.queryByText('Boxing A')).not.toBeInTheDocument();
    expect(screen.getByText('Run B')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All' }));
    const searchInput = screen.getByPlaceholderText('Search saved workouts...');
    expect(searchInput).toHaveAttribute('autocomplete', 'off');
    expect(searchInput).toHaveAttribute('autocorrect', 'off');
    await user.type(searchInput, 'box');
    expect(screen.getByText('Boxing A')).toBeInTheDocument();
    expect(screen.queryByText('Run B')).not.toBeInTheDocument();
  });

  it('deletes a program after confirmation', async () => {
    const user = userEvent.setup();
    await sessionsStorage.saveAll([makeSession({ id: 'd1', name: 'To Delete' })]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);

    await waitFor(() => expect(screen.getByText('To Delete')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByText('To Delete')).not.toBeInTheDocument());
  });

  it('keeps a program when deletion is cancelled', async () => {
    const user = userEvent.setup();
    await sessionsStorage.saveAll([makeSession({ id: 'd2', name: 'Keep Me' })]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App />);

    await waitFor(() => expect(screen.getByText('Keep Me')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Keep Me')).toBeInTheDocument();
  });

  it('restores directly into a running session after a reload', async () => {
    await sessionsStorage.saveAll([makeSession({ id: 'live', name: 'Resumed Workout' })]);
    const snapshot: TimerSnapshot = {
      status: 'running',
      phase: 'work',
      prepTargetPhase: 'work',
      currentRound: 2,
      remainingSeconds: 120,
      phaseStartedAt: Date.now(),
      phaseDurationSeconds: 180,
      elapsedBeforePauseSeconds: 0,
    };
    await runStateStorage.save({ sessionId: 'live', snapshot, savedAt: Date.now() });

    render(<App />);

    // Opens straight into the run screen for the persisted session.
    await waitFor(() => expect(screen.getByText('LIVE SESSION')).toBeInTheDocument());
    const header = screen.getByText('LIVE SESSION').parentElement as HTMLElement;
    expect(within(header).getByText('Resumed Workout')).toBeInTheDocument();
  });
});
