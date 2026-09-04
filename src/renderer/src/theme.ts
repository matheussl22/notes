export type ThemeId = 'paper' | 'ink' | 'night' | 'sand'

/**
 * Cores usadas só para desenhar a miniatura de cada tema em Configurações.
 * Espelham os valores de `assets/tokens.css`; ao mudar um tema lá, atualize aqui.
 */
export type ThemePreview = {
  sidebar: string
  panel: string
  line: string
  text: string
  muted: string
  accent: string
}

export const themes: { id: ThemeId; preview: ThemePreview }[] = [
  {
    id: 'paper',
    preview: {
      sidebar: '#f5f4f1',
      panel: '#ffffff',
      line: '#e6e3dd',
      text: '#1c1b19',
      muted: '#c9c5bc',
      accent: '#14665c'
    }
  },
  {
    id: 'ink',
    preview: {
      sidebar: '#eef1f4',
      panel: '#ffffff',
      line: '#d8dee6',
      text: '#1a1d21',
      muted: '#c4ccd6',
      accent: '#1f4e79'
    }
  },
  {
    id: 'sand',
    preview: {
      sidebar: '#f3e8d6',
      panel: '#fffaf2',
      line: '#e4d3b8',
      text: '#2a2118',
      muted: '#d2bc98',
      accent: '#9a4b1f'
    }
  },
  {
    id: 'night',
    preview: {
      sidebar: '#1c1b18',
      panel: '#1f1e1b',
      line: '#2f2d28',
      text: '#eceae4',
      muted: '#45423b',
      accent: '#7dbaad'
    }
  }
]

export const themeLabels: Record<string, Record<ThemeId, string>> = {
  pt: { paper: 'Papel', ink: 'Tinta', sand: 'Areia', night: 'Noite' },
  en: { paper: 'Paper', ink: 'Ink', sand: 'Sand', night: 'Night' },
  es: { paper: 'Papel', ink: 'Tinta', sand: 'Arena', night: 'Noche' }
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme
}
