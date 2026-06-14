// Core
import { useMemo, useState } from 'react';

// App
import { useSessions } from '@/app/SessionsProvider';

// Components
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

  return (
    <div
      className="app-shell scroll-area"
      style={{
        backgroundColor: theme.colors.background,
        padding: '54px 14px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 0.2, color: theme.colors.text }}>
          My Sessions
        </h1>
        <button
          type="button"
          onClick={() => navigation.navigate('Settings')}
          style={{ padding: '8px 10px', color: theme.colors.primary, fontWeight: 700 }}
        >
          Settings
        </button>
      </div>

      <div
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceStrong,
          borderRadius: 18,
          padding: '0 14px',
          marginBottom: 12,
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search saved workouts..."
          style={{
            width: '100%',
            height: 52,
            border: 'none',
            background: 'transparent',
            fontSize: 18,
            fontWeight: 600,
            color: theme.colors.text,
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
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
                borderRadius: 20,
                minHeight: 42,
                minWidth: 86,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 14px',
                fontWeight: 700,
                backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                borderColor: active ? 'transparent' : theme.colors.border,
                color: active ? theme.colors.primaryText : theme.colors.textMuted,
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 104 }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: 44, fontSize: 15, color: theme.colors.textMuted }}>
            {isLoading ? 'Loading...' : 'No sessions found'}
          </p>
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
          width: 74,
          height: 74,
          borderRadius: 37,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primary,
          color: theme.colors.primaryText,
          fontSize: 36,
          lineHeight: '36px',
          boxShadow: '0 8px 12px rgba(30,99,236,0.45)',
        }}
      >
        +
      </button>
    </div>
  );
};
