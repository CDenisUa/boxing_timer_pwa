// Core
import { useMemo, useState } from 'react';

// App
import { useSessions } from '@/app/SessionsProvider';

// Components
import { PrimaryButton } from '@/components/PrimaryButton';
import { SessionCard } from '@/components/SessionCard';

// Navigation
import { ScreenProps } from '@/navigation/RootNavigator';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

// Types
import { SessionCategory } from '@/types/models';

// Utils
import { confirmAction } from '@/utils/dialog';

type FilterValue = 'all' | SessionCategory;

const filters: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Boxing', value: 'boxing' },
  { label: 'Running', value: 'running' },
  { label: 'Custom', value: 'custom' },
];

export const SessionsListScreen = ({ navigation }: ScreenProps<'SessionsList'>) => {
  const { theme } = useTheme();
  const { sessions, isLoading, deleteSession } = useSessions();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sessions.filter((session) => {
      if (activeFilter !== 'all' && session.category !== activeFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return session.name.toLowerCase().includes(query);
    });
  }, [activeFilter, search, sessions]);

  const totalRounds = useMemo(
    () => sessions.reduce((sum, session) => sum + session.rounds, 0),
    [sessions],
  );

  return (
    <div
      className="app-shell scroll-area"
      style={{
        backgroundColor: theme.colors.background,
        padding: '42px 14px 12px',
        gap: 16,
      }}
    >
      <div
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderRadius: 8,
          padding: 16,
          marginBottom: 14,
          boxShadow: theme.isDark ? 'none' : '0 12px 30px rgba(17, 24, 39, 0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.2, color: theme.colors.textMuted }}>
              BOX TIMER
            </div>
            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 28,
                fontWeight: 950,
                lineHeight: 1,
                color: theme.colors.text,
              }}
            >
              Programs
            </h1>
          </div>
          <PrimaryButton
            label="Settings"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('Settings')}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            marginTop: 18,
          }}
        >
          {[
            ['Saved', String(sessions.length)],
            ['Rounds', String(totalRounds)],
            ['Shown', String(filtered.length)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                borderTopWidth: 1,
                borderTopStyle: 'solid',
                borderTopColor: theme.colors.border,
                paddingTop: 10,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: theme.colors.textMuted }}>{label}</div>
              <div style={{ marginTop: 2, fontSize: 20, fontWeight: 950, color: theme.colors.text }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.input,
          borderRadius: 8,
          padding: '0 12px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 900, color: theme.colors.textSubtle }}>Find</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search saved workouts..."
          style={{
            width: '100%',
            height: 48,
            border: 'none',
            background: 'transparent',
            fontSize: 16,
            fontWeight: 700,
            color: theme.colors.text,
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 6,
          marginBottom: 14,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceStrong,
          borderRadius: 8,
          padding: 4,
        }}
      >
        {filters.map((filter) => {
          const active = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              style={{
                borderWidth: 1,
                borderStyle: 'solid',
                borderRadius: 6,
                minHeight: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
                fontWeight: 800,
                fontSize: 13,
                backgroundColor: active ? theme.colors.card : 'transparent',
                borderColor: active ? theme.colors.borderStrong : 'transparent',
                color: active ? theme.colors.text : theme.colors.textMuted,
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 104 }}>
        {filtered.length === 0 ? (
          <div
            style={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              borderRadius: 8,
              padding: 22,
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 900, color: theme.colors.text }}>
              {isLoading ? 'Loading programs' : 'No programs found'}
            </div>
            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: theme.colors.textMuted }}>
              {search || activeFilter !== 'all'
                ? 'Try another search or filter.'
                : 'Create your first boxing, running, or custom interval program.'}
            </div>
            {!isLoading && !search && activeFilter === 'all' ? (
              <PrimaryButton
                label="Create program"
                onPress={() => navigation.navigate('SessionEditor')}
                style={{ width: '100%', marginTop: 18 }}
              />
            ) : null}
          </div>
        ) : (
          filtered.map((item) => (
            <SessionCard
              key={item.id}
              session={item}
              onPress={() => navigation.navigate('SessionRun', { sessionId: item.id })}
              onEdit={() => navigation.navigate('SessionEditor', { sessionId: item.id })}
              onDelete={() => {
                if (confirmAction(`Delete "${item.name}"?`)) {
                  void deleteSession(item.id);
                }
              }}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => navigation.navigate('SessionEditor')}
        aria-label="Add session"
        style={{
          position: 'fixed',
          right: 'max(18px, calc(50% - 240px + 18px))',
          bottom: 24,
          width: 64,
          height: 64,
          borderRadius: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primary,
          color: theme.colors.primaryText,
          fontSize: 34,
          lineHeight: '34px',
          fontWeight: 600,
          boxShadow: theme.isDark
            ? '0 14px 30px rgba(110, 168, 255, 0.22)'
            : '0 14px 30px rgba(34, 88, 216, 0.28)',
        }}
      >
        +
      </button>
    </div>
  );
};
