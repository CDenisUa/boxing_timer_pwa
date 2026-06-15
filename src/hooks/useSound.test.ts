// Core
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
// Hooks
import { SOUND_FILES, soundOptions, useSound } from '@/hooks/useSound';

describe('useSound', () => {
  it('exposes an option for every sound file', () => {
    const optionIds = soundOptions.map((o) => o.id).sort();
    expect(optionIds).toEqual(Object.keys(SOUND_FILES).sort());
  });

  it('plays a sound and vibrates by default', async () => {
    const playSpy = window.HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>;
    const { result } = renderHook(() => useSound());

    await act(async () => {
      await result.current.play('beep');
    });

    expect(navigator.vibrate).toHaveBeenCalledWith(180);
    expect(playSpy).toHaveBeenCalled();
  });

  it('can skip vibration', async () => {
    const { result } = renderHook(() => useSound());
    await act(async () => {
      await result.current.play('bell', { vibrate: false });
    });
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it('swallows playback rejections from autoplay policy', async () => {
    const playSpy = window.HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>;
    playSpy.mockRejectedValueOnce(new Error('blocked'));
    const { result } = renderHook(() => useSound());
    await expect(result.current.play('gong')).resolves.toBeUndefined();
  });
});
