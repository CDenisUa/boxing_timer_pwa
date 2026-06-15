// Core
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
// Components
import { NumberField } from '@/components/NumberField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ROUND_EVEN_COLOR, ROUND_ODD_COLOR, RoundTiles, roundColor } from '@/components/RoundTiles';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SemiCircularProgress } from '@/components/SemiCircularProgress';
import { SessionCard } from '@/components/SessionCard';
import { TimerDisplay } from '@/components/TimerDisplay';
import { TimeWheelField } from '@/components/TimeWheelField';
// Test
import { makeSession, renderWithTheme } from '@/test/utils';

describe('PrimaryButton', () => {
  it('renders its label and fires onPress on click', async () => {
    const onPress = vi.fn();
    renderWithTheme(<PrimaryButton label="Start" onPress={onPress} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', async () => {
    const onPress = vi.fn();
    renderWithTheme(<PrimaryButton label="Go" onPress={onPress} disabled />);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('supports an explicit aria label', () => {
    renderWithTheme(<PrimaryButton label="+" onPress={vi.fn()} ariaLabel="Add" />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});

describe('NumberField', () => {
  it('parses input and enforces the minimum', () => {
    const onChange = vi.fn();
    renderWithTheme(<NumberField label="Rounds" value={3} onChange={onChange} min={1} />);
    const input = screen.getByLabelText('Rounds');

    fireEvent.change(input, { target: { value: '8' } });
    expect(onChange).toHaveBeenLastCalledWith(8);

    fireEvent.change(input, { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(1); // clamped to min

    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(1); // NaN falls back to min
  });
});

describe('SegmentedControl', () => {
  const options = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
    { label: 'C', value: 'c' },
  ];

  it('selects an option on click', async () => {
    const onChange = vi.fn();
    renderWithTheme(<SegmentedControl value="a" onChange={onChange} options={options} />);
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders every option', () => {
    renderWithTheme(<SegmentedControl value="a" onChange={vi.fn()} options={options} maxPerRow={2} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });
});

describe('SessionCard', () => {
  it('shows a uniform session summary and wires the actions', async () => {
    const onPress = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithTheme(
      <SessionCard session={makeSession()} onPress={onPress} onEdit={onEdit} onDelete={onDelete} />,
    );

    expect(screen.getByText('Heavy Bag')).toBeInTheDocument();
    expect(screen.getByText('3 rounds - 11:00')).toBeInTheDocument(); // 3x180 work + 2x60 rest
    expect(screen.getByText('03:00')).toBeInTheDocument(); // work value

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('shows "Varies" for a non-uniform session', () => {
    const session = makeSession({
      rounds: 2,
      roundsConfig: [
        { workSeconds: 120, restSeconds: 30 },
        { workSeconds: 60, restSeconds: 0 },
      ],
    });
    renderWithTheme(<SessionCard session={session} onPress={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getAllByText('Varies').length).toBeGreaterThanOrEqual(1);
  });
});

describe('TimerDisplay', () => {
  it('renders the phase label, clock and round info', () => {
    renderWithTheme(
      <TimerDisplay phase="work" remainingSeconds={75} roundLabel="Round 1 / 3" phaseProgress={0.5} />,
    );
    expect(screen.getByText('WORK')).toBeInTheDocument();
    expect(screen.getByText('01:15')).toBeInTheDocument();
    expect(screen.getByText('Round 1 / 3')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows an hours component for long durations', () => {
    renderWithTheme(<TimerDisplay phase="prep" remainingSeconds={3661} roundLabel="" />);
    expect(screen.getByText('01:01:01')).toBeInTheDocument();
    expect(screen.getByText('GET READY')).toBeInTheDocument();
  });
});

describe('SemiCircularProgress', () => {
  it('renders two arc paths', () => {
    const { container } = renderWithTheme(
      <SemiCircularProgress progress={0.5} color="#fff" trackColor="#000" />,
    );
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });

  it('clamps out-of-range progress without throwing', () => {
    expect(() =>
      renderWithTheme(<SemiCircularProgress progress={5} color="#fff" trackColor="#000" />),
    ).not.toThrow();
  });
});

describe('RoundTiles', () => {
  const rounds = [
    { workSeconds: 120, restSeconds: 30 },
    { workSeconds: 90, restSeconds: 30 },
    { workSeconds: 60, restSeconds: 0 },
  ];

  it('colours rounds by parity: odd green, even orange', () => {
    expect(roundColor(1)).toBe(ROUND_ODD_COLOR);
    expect(roundColor(3)).toBe(ROUND_ODD_COLOR);
    expect(roundColor(2)).toBe(ROUND_EVEN_COLOR);
    expect(roundColor(4)).toBe(ROUND_EVEN_COLOR);
  });

  it('renders nothing for a single-round session', () => {
    const { container } = renderWithTheme(
      <RoundTiles rounds={[{ workSeconds: 60, restSeconds: 0 }]} currentRound={1} onSelect={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a tile per round and reports the selection (1-based)', async () => {
    const onSelect = vi.fn();
    renderWithTheme(<RoundTiles rounds={rounds} currentRound={1} onSelect={onSelect} />);

    expect(screen.getByText('R1')).toBeInTheDocument();
    expect(screen.getByText('R3')).toBeInTheDocument();
    expect(screen.getByText('02:00')).toBeInTheDocument(); // round 1 work time

    await userEvent.click(screen.getByText('R2'));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});

describe('TimeWheelField', () => {
  it('opens the picker, selects minutes/seconds on the wheels and applies', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithTheme(<TimeWheelField label="WORK" valueSeconds={90} onChange={onChange} />);

    // Trigger shows 01:30.
    expect(screen.getByText('01:30')).toBeInTheDocument();
    await user.click(screen.getByText('Set interval'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2 minutes' }));
    await user.click(screen.getByRole('button', { name: '15 seconds' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    // 2:15 = 135s.
    expect(onChange).toHaveBeenCalledWith(135);
  });

  it('clamps the applied value to the minimum', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithTheme(<TimeWheelField label="WORK" valueSeconds={90} onChange={onChange} minSeconds={5} />);
    await user.click(screen.getByText('Set interval'));
    await user.click(screen.getByRole('button', { name: '0 minutes' }));
    await user.click(screen.getByRole('button', { name: '0 seconds' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('closes without changes on cancel', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithTheme(<TimeWheelField label="REST" valueSeconds={30} onChange={onChange} />);
    await user.click(screen.getByText('Set interval'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
