import { useEffect, useEffectEvent } from 'react';

export interface Shortcut {
  /** KeyboardEvent.key, lower-cased. */
  key: string;
  /** Requires Ctrl (or Cmd on macOS). Mod shortcuts also fire while typing. */
  mod?: boolean;
  handler: () => void;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * Window-level shortcuts for the viewer. Single-key shortcuts are ignored while the
 * user types, so "1" in the note field is just a "1" (WCAG 2.1.4 Character Key Shortcuts).
 */
export function useShortcuts(shortcuts: Shortcut[], enabled = true) {
  // An effect event always sees the latest shortcuts without re-subscribing.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const mod = event.ctrlKey || event.metaKey;
    for (const shortcut of shortcuts) {
      if (shortcut.key !== event.key.toLowerCase() || Boolean(shortcut.mod) !== mod || event.altKey) continue;
      if (!shortcut.mod && isTyping(event.target)) continue;
      event.preventDefault();
      shortcut.handler();
      return;
    }
  });

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
