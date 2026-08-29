import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { messages, type Locale, type Messages } from './i18n'
import { applyTheme, type ThemeId } from './theme'

const KEY = 'notes.settings'

type Stored = {
  locale: Locale
  theme: ThemeId
}

type SettingsValue = Stored & {
  t: Messages
  setLocale: (locale: Locale) => void
  setTheme: (theme: ThemeId) => void
}

const SettingsContext = createContext<SettingsValue | null>(null)

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { locale: 'pt', theme: 'paper' }
    const parsed = JSON.parse(raw) as Partial<Stored>
    return {
      locale: parsed.locale === 'en' || parsed.locale === 'es' ? parsed.locale : 'pt',
      theme:
        parsed.theme === 'ink' || parsed.theme === 'night' || parsed.theme === 'sand'
          ? parsed.theme
          : 'paper'
    }
  } catch {
    return { locale: 'pt', theme: 'paper' }
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [stored, setStored] = useState<Stored>(readStored)

  useEffect(() => {
    applyTheme(stored.theme)
    localStorage.setItem(KEY, JSON.stringify(stored))
    document.documentElement.lang = stored.locale
  }, [stored])

  const value = useMemo<SettingsValue>(
    () => ({
      ...stored,
      t: messages[stored.locale],
      setLocale: (locale) => setStored((current) => ({ ...current, locale })),
      setTheme: (theme) => setStored((current) => ({ ...current, theme }))
    }),
    [stored]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('SettingsProvider ausente')
  return value
}

applyTheme(readStored().theme)
