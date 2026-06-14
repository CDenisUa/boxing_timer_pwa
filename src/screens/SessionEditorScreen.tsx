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

const soundLabel = (label: string) =>
  label
    .replace('Boxing Gong (Default)', 'Boxing')
    .replace('Classic Gong', 'Classic')
    .replace('Gong (Legacy)', 'Gong');

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
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
    color: theme.colors.textMuted,
  };

  const sectionStyle = {
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    boxShadow: theme.isDark ? 'none' : '0 12px 28px rgba(17, 24, 39, 0.06)',
  };

  return (
    <div
      className="app-shell scroll-area"
      style={{
        backgroundColor: theme.colors.background,
        padding: '42px 14px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderRadius: 8,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <PrimaryButton label="Close" variant="secondary" size="sm" onPress={() => navigation.goBack()} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.1, color: theme.colors.textMuted }}>
            PROGRAM
          </div>
          <h1
            style={{
              margin: '2px 0 0',
              fontSize: 22,
              fontWeight: 950,
              lineHeight: 1.05,
              color: theme.colors.text,
            }}
          >
            {current ? 'Edit workout' : 'New workout'}
          </h1>
        </div>
        <PrimaryButton label="Save" size="sm" onPress={save} />
      </div>

      <div style={sectionStyle}>
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
            backgroundColor: theme.colors.input,
            borderRadius: 8,
            padding: '0 16px',
            fontSize: 17,
            fontWeight: 800,
            color: theme.colors.text,
          }}
        />
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Category</span>
        <SegmentedControl value={category} onChange={setCategory} options={categoryOptions} maxPerRow={3} />
      </div>

      <div style={{ ...sectionStyle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: theme.colors.text }}>Rounds</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textMuted }}>Total work cycles</div>
        </div>

        <div
          style={{
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            minHeight: 52,
            padding: 5,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={() => setRounds((value) => Math.max(1, value - 1))}
            style={{
              width: 44,
              height: 42,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 900,
              backgroundColor: theme.colors.surfaceStrong,
              color: theme.colors.text,
            }}
          >
            -
          </button>
          <span style={{ minWidth: 44, textAlign: 'center', fontSize: 21, fontWeight: 950, color: theme.colors.text }}>
            {rounds}
          </span>
          <button
            type="button"
            onClick={() => setRounds((value) => value + 1)}
            style={{
              width: 44,
              height: 42,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 900,
              backgroundColor: theme.colors.surfaceStrong,
              color: theme.colors.text,
            }}
          >
            +
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <div>
          <span style={labelStyle}>Timing</span>
          <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: theme.colors.textMuted }}>
            Set the active interval and recovery interval.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <TimeWheelField label="WORK" valueSeconds={workSeconds} onChange={setWorkSeconds} minSeconds={1} />
          <TimeWheelField label="REST" valueSeconds={restSeconds} onChange={setRestSeconds} minSeconds={1} />
        </div>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Alert Sound</span>
        <SegmentedControl
          value={soundId}
          onChange={(next) => {
            setSoundId(next);
            void play(next, { vibrate: false });
          }}
          options={soundOptions.map((option) => ({ label: soundLabel(option.label), value: option.id }))}
          maxPerRow={3}
        />
      </div>
    </div>
  );
};
