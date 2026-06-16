// Core
import type { InputHTMLAttributes } from 'react';

/**
 * Attributes shared by every free-text input in the app. They keep typing
 * frictionless on mobile (especially iOS): no autofill/contact suggestion bar
 * hijacking the first tap, no autocorrect/autocapitalize rewriting the value,
 * and no spellcheck squiggles. Without these iOS can swallow the initial focus
 * with an autofill prompt — so the keyboard never opens until it's dismissed.
 */
export const plainTextInputProps: Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'autoComplete' | 'autoCorrect' | 'autoCapitalize' | 'spellCheck'
> = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
};
