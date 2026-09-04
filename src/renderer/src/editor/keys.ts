/** Atalhos mostrados nos `title` dos botões. `Mod` vira Ctrl (ou ⌘ no macOS). */

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '')

export function shortcut(keys: string): string {
  return keys.replace('Mod', isMac ? '⌘' : 'Ctrl')
}

/** "Negrito (Ctrl+B)" */
export function withShortcut(label: string, keys: string): string {
  return `${label} (${shortcut(keys)})`
}
