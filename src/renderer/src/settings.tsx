import { useEffect, useMemo, useState } from 'react'
import { messages } from './i18n'
import { SettingsContext, type SettingsValue, type Stored } from './settings-context'
import { applyTheme } from './theme'

const KEY = 'notes.settings'

function normalize(input: Partial<Record<keyof Stored, string | null | undefined>>): Stored {
  return {
    locale: input.locale === 'en' || input.locale === 'es' ? input.locale : 'pt',
    theme:
      input.theme === 'ink' || input.theme === 'night' || input.theme === 'sand'
        ? input.theme
        : 'paper'
  }
}

function readStored(): Stored {
  // harness de screenshot: ?theme=night&locale=en vence o que estiver salvo
  const params = new URLSearchParams(window.location.search)
  if (params.has('theme') || params.has('locale')) {
    return normalize({ theme: params.get('theme'), locale: params.get('locale') })
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return normalize({})
    return normalize(JSON.parse(raw) as Partial<Stored>)
  } catch {
    return normalize({})
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

applyTheme(readStored().theme)
