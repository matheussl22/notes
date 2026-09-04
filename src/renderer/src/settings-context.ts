import { createContext, useContext } from 'react'
import type { Locale, Messages } from './i18n'
import type { ThemeId } from './theme'

export type Stored = {
  locale: Locale
  theme: ThemeId
}

export type SettingsValue = Stored & {
  t: Messages
  setLocale: (locale: Locale) => void
  setTheme: (theme: ThemeId) => void
}

export const SettingsContext = createContext<SettingsValue | null>(null)

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('SettingsProvider ausente')
  return value
}
