import { ActionId, KeyBindings } from './types';

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveForward: 'KeyW',
  moveBackward: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  jump: 'Mouse2', // Right-click jump as requested
  tun: 'KeyT',
  jelly: 'KeyJ',
  waterSense: 'KeyQ',
  interact: 'KeyE',
  diary: 'KeyB',
  pause: 'Escape',
};

export const SECONDARY_JUMP_KEY = 'Space';

export const ACTION_ORDER: ActionId[] = [
  'moveForward',
  'moveBackward',
  'moveLeft',
  'moveRight',
  'jump',
  'tun',
  'jelly',
  'waterSense',
  'interact',
  'diary',
  'pause',
];

export function formatBindingCode(code: string): string {
  if (!code) return '—';
  if (code === 'Mouse0') return 'Left Click';
  if (code === 'Mouse1') return 'Middle Click';
  if (code === 'Mouse2') return 'Right Click';
  if (code === 'Space') return 'Space';
  if (code === 'Escape') return 'Esc';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return code.slice(5);
  return code;
}

export function eventToBindingCode(e: KeyboardEvent | MouseEvent): string | null {
  if ('button' in e && typeof e.button === 'number' && !('key' in e)) {
    return `Mouse${e.button}`;
  }
  if ('code' in e && typeof e.code === 'string') {
    if (e.code === 'Unidentified' || e.code === '') return null;
    return e.code;
  }
  return null;
}

export function rebindAction(
  current: KeyBindings,
  action: ActionId,
  newCode: string
): KeyBindings {
  const next: KeyBindings = { ...current };
  // Swap if another action already uses newCode
  const existingAction = (Object.keys(next) as ActionId[]).find(
    (k) => k !== action && next[k] === newCode
  );
  if (existingAction) {
    next[existingAction] = next[action];
  }
  next[action] = newCode;
  return next;
}
