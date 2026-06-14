// Core
import { memo } from 'react';

// Components
import { PrimaryButton } from '@/components/PrimaryButton';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

// Types
import { Session } from '@/types/models';

// Utils
import { formatSecondsToClock } from '@/utils/timeFormat';

type Props = {
  session: Session;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const categoryTone = {
  boxing: '#2E65E8',
  running: '#8A5DE8',
  custom: '#2AB58D',
} as const;

const SessionCardComponent = ({ session, onPress, onEdit, onDelete }: Props) => {
  const { theme } = useTheme();

  return (
    <div
      onClick={onPress}
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        borderRadius: 24,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.surfaceStrong,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: categoryTone[session.category],
            }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: theme.colors.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {session.name}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.4,
              color: theme.colors.textMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {session.category.toUpperCase()} • {session.rounds} ROUNDS
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            borderRadius: 14,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minHeight: 76,
            backgroundColor: theme.colors.surface,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.8, color: theme.colors.textMuted }}>
            WORK
          </span>
          <span style={{ fontSize: 17, fontWeight: 800, color: theme.colors.text }}>
            {formatSecondsToClock(session.workSeconds)}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            borderRadius: 14,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minHeight: 76,
            backgroundColor: theme.colors.surface,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.8, color: theme.colors.textMuted }}>
            REST
          </span>
          <span style={{ fontSize: 17, fontWeight: 800, color: theme.colors.text }}>
            {formatSecondsToClock(session.restSeconds)}
          </span>
        </div>

        <div style={{ width: 120, display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <PrimaryButton label="Start" onPress={onPress} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <PrimaryButton label="Edit" variant="secondary" onPress={onEdit} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          <PrimaryButton label="Delete" variant="danger" onPress={onDelete} style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
};

export const SessionCard = memo(SessionCardComponent);
