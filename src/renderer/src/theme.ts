export type ThemeId = 'paper' | 'ink' | 'night' | 'sand'

export const themes: { id: ThemeId; swatch: [string, string, string] }[] = [
  { id: 'paper', swatch: ['#f5f4f1', '#14665c', '#1c1b19'] },
  { id: 'ink', swatch: ['#f3f5f7', '#1f4e79', '#1a1d21'] },
  { id: 'sand', swatch: ['#f6efe4', '#9a4b1f', '#2a2118'] },
  { id: 'night', swatch: ['#161513', '#7dbaad', '#eceae4'] }
]

export const themeLabels: Record<string, Record<ThemeId, string>> = {
  pt: { paper: 'Papel', ink: 'Tinta', sand: 'Areia', night: 'Noite' },
  en: { paper: 'Paper', ink: 'Ink', sand: 'Sand', night: 'Night' },
  es: { paper: 'Papel', ink: 'Tinta', sand: 'Arena', night: 'Noche' }
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme
}
