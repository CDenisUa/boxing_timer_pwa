// Core
import { memo } from 'react';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

// Types
import { RoundConfig } from '@/types/models';

// Utils
import { formatSecondsToClock } from '@/utils/timeFormat';

type Props = {
  rounds: RoundConfig[];
  /** 1-based round currently running. */
  currentRound: number;
  /** Jump to a 1-based round. */
  onSelect: (round: number) => void;
};

const RoundTilesComponent = ({ rounds, currentRound, onSelect }: Props) => {
  const { theme } = useTheme();

  if (rounds.length <= 1) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '2px 2px 6px',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {rounds.map((round, index) => {
        const roundNumber = index + 1;
        const isActive = roundNumber === currentRound;

        return (
          <button
            key={roundNumber}
            type="button"
            onClick={() => onSelect(roundNumber)}
            style={{
              flex: '0 0 auto',
              minWidth: 56,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '8px 10px',
              borderRadius: 10,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: isActive ? theme.colors.primary : theme.colors.border,
              backgroundColor: isActive ? `${theme.colors.primary}22` : theme.colors.card,
              color: isActive ? theme.colors.primary : theme.colors.textMuted,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6 }}>
              R{roundNumber}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: isActive ? theme.colors.primary : theme.colors.text,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatSecondsToClock(round.workSeconds)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const RoundTiles = memo(RoundTilesComponent);
