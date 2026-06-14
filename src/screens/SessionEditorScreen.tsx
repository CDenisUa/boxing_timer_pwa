// Core
import { useEffect, useMemo, useState } from 'react';

// App
import { useSessions } from '@/app/SessionsProvider';

// Components
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TimeWheelField } from '@/components/TimeWheelField';

// Hooks
import { soundOptions, useSound } from '@/hooks/useSound';

// Navigation
import { ScreenProps } from '@/navigation/RootNavigator';

// Storage
import { settingsStorage } from '@/storage/settingsStorage';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

// Types
import { SessionCategory, SoundId } from '@/types/models';

// Utils
import { notify } from '@/utils/dialog';

const categoryOptions: { label: string; value: SessionCategory }[] = [
  { label: 'Boxing', value: 'boxing' },
  { label: 'Running', value: 'running' },
  { label: 'Custom', value: 'custom' },
];

export const SessionEditorScreen = ({ navigation, route }: ScreenProps<'SessionEditor'>) => {
  const { theme } = useTheme();
  const { createSession, updateSession, getById } = useSessions();
  const { play } = useSound();

  const current = useMemo(() => {
    if (!route.params?.sessionId) {
      return undefined;
    }
    return getById(route.params.sessionId);
  }, [getById, route.params?.sessionId]);

  const [name, setName] = useState(current?.name ?? '');
  const [category, setCategory] = useState<SessionCategory>(current?.category ?? 'boxing');
  const [rounds, setRounds] = useState(current?.rounds ?? 3);
  const [workSeconds, setWorkSeconds] = useState(current?.workSeconds ?? 180);
  const [restSeconds, setRestSeconds] = useState(current?.restSeconds ?? 60);
  const [soundId, setSoundId] = useState<SoundId>(current?.soundId ?? 'boxing-gong');

  useEffect(() => {
    if (current) {
      return;
    }

    let mounted = true;

    const loadDefaultSound = async () => {
      const settings = await settingsStorage.get();
      if (!mounted) {
        return;
      }
      setSoundId(settings.defaultSoundId);
    };

    void loadDefaultSound();

    return () => {
      mounted = false;
    };
  }, [current]);

  const save = async () => {
    if (!name.trim()) {
      notify('Name is required');
      return;
    }

    if (rounds < 1 || workSeconds < 1 || restSeconds < 1) {
      notify('Values must be at least 1 second');
      return;
    }

    const draft = {
      name: name.trim(),
      category,
      rounds,
      workSeconds,
      restSeconds,
      soundId,
    };

    if (!current) {
      await createSession(draft);
    } else {
      await updateSession(current.id, draft);
    }

    navigation.goBack();
  };

  const labelStyle = {
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: theme.colors.textMuted,
  };

  return (
    <div
      className="app-shell scroll-area"
      style={{
        backgroundColor: theme.colors.background,
        padding: '54px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <PrimaryButton label="Close" variant="secondary" onPress={() => navigation.goBack()} />
        <h1 style={{ flex: 1, margin: 0, fontSize: 24, fontWeight: 900, textAlign: 'center', color: theme.colors.text }}>
          Edit Workout
        </h1>
        <PrimaryButton label="Save" onPress={save} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={labelStyle}>Session Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Heavy Bag Drill"
          style={{
            height: 58,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
            borderRadius: 18,
            padding: '0 16px',
            fontSize: 17,
            fontWeight: 700,
            color: theme.colors.text,
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={labelStyle}>Category</span>
        <SegmentedControl value={category} onChange={setCategory} options={categoryOptions} maxPerRow={3} />
      </div>

      <div
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderRadius: 22,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: theme.colors.text }}>Rounds</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textMuted }}>Total cycles</div>
        </div>

        <div
          style={{
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            borderRadius: 18,
            minHeight: 62,
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setRounds((value) => Math.max(1, value - 1))}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
              backgroundColor: theme.colors.surfaceStrong,
              color: theme.colors.text,
            }}
          >
            -
          </button>
          <span style={{ minWidth: 44, textAlign: 'center', fontSize: 21, fontWeight: 900, color: theme.colors.text }}>
            {rounds}
          </span>
          <button
            type="button"
            onClick={() => setRounds((value) => value + 1)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
              backgroundColor: theme.colors.surfaceStrong,
              color: theme.colors.text,
            }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <TimeWheelField label="WORK" valueSeconds={workSeconds} onChange={setWorkSeconds} minSeconds={1} />
        <TimeWheelField label="REST" valueSeconds={restSeconds} onChange={setRestSeconds} minSeconds={1} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={labelStyle}>Alert Sound</span>
        <SegmentedControl
          value={soundId}
          onChange={(next) => {
            setSoundId(next);
            void play(next, { vibrate: false });
          }}
          options={soundOptions.map((option) => ({ label: option.label, value: option.id }))}
          maxPerRow={3}
        />
      </div>
    </div>
  );
};
