// Core
import { useEffect, useMemo, useState } from 'react';

// App
import { useSessions } from '@/app/SessionsProvider';

// Components
import { NumberField } from '@/components/NumberField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';

// Hooks
import { soundOptions, useSound } from '@/hooks/useSound';

// Navigation
import { ScreenProps } from '@/navigation/RootNavigator';

// Storage
import { defaultSettings, settingsStorage } from '@/storage/settingsStorage';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

// Types
import { ThemeMode } from '@/types/models';

// Utils
import { notify } from '@/utils/dialog';

const themeOptions: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export const SettingsScreen = ({ navigation }: ScreenProps<'Settings'>) => {
  const { theme, mode, setMode } = useTheme();
  const { applySoundToAll } = useSessions();
  const { play } = useSound();
  const [defaultSoundId, setDefaultSoundId] = useState(defaultSettings.defaultSoundId);
  const [keepScreenAwake, setKeepScreenAwake] = useState(defaultSettings.keepScreenAwake);
  const [prepSeconds, setPrepSeconds] = useState(defaultSettings.prepSeconds);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const settings = await settingsStorage.get();
      if (!mounted) {
        return;
      }
      setDefaultSoundId(settings.defaultSoundId);
      setKeepScreenAwake(settings.keepScreenAwake);
      setPrepSeconds(settings.prepSeconds);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const save = async () => {
    if (prepSeconds < 0) {
      notify('Prep countdown must be 0 or more');
      return;
    }

    await settingsStorage.save({
      themeMode: mode,
      defaultSoundId,
      keepScreenAwake,
      prepSeconds,
    });
    await applySoundToAll(defaultSoundId);

    navigation.navigate('SessionsList');
  };

  const soundSegmentOptions = useMemo(
    () => soundOptions.map((option) => ({ label: option.label, value: option.id })),
    [],
  );

  const labelStyle = { fontSize: 13, fontWeight: 600, color: theme.colors.textMuted };

  return (
    <div
      className="app-shell scroll-area"
      style={{
        backgroundColor: theme.colors.background,
        padding: '54px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }}>
        <PrimaryButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: theme.colors.text }}>Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={labelStyle}>Theme</span>
        <SegmentedControl value={mode} onChange={(next) => void setMode(next)} options={themeOptions} maxPerRow={3} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={labelStyle}>Default Sound</span>
        <SegmentedControl
          value={defaultSoundId}
          onChange={(next) => {
            setDefaultSoundId(next);
            void play(next, { vibrate: false });
          }}
          options={soundSegmentOptions}
          maxPerRow={3}
        />
      </div>

      <NumberField label="Prep countdown (seconds)" value={prepSeconds} onChange={setPrepSeconds} min={0} />

      <label
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <span style={{ color: theme.colors.text, fontWeight: 600 }}>Keep screen awake</span>
        <input
          type="checkbox"
          checked={keepScreenAwake}
          onChange={(event) => setKeepScreenAwake(event.target.checked)}
          style={{ width: 22, height: 22, accentColor: theme.colors.primary }}
        />
      </label>

      <PrimaryButton label="Save Settings" onPress={save} />
    </div>
  );
};
