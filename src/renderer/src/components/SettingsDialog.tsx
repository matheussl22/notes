import { useEffect, useRef } from 'react'
import { locales } from '../i18n'
import { useSettings } from '../settings-context'
import { themeLabels, themes, type ThemePreview } from '../theme'

type Props = {
  onClose: () => void
}

/** Miniatura 56×36 do tema: faixa da sidebar, painel e duas linhas de "texto". */
function ThemeThumb({ preview }: { preview: ThemePreview }): React.JSX.Element {
  return (
    <span
      className="theme-thumb"
      aria-hidden
      style={{ background: preview.panel, borderColor: preview.line }}
    >
      <i
        className="thumb-side"
        style={{ background: preview.sidebar, borderRightColor: preview.line }}
      >
        <i className="thumb-sel" style={{ background: preview.accent }} />
      </i>
      <i className="thumb-line" style={{ background: preview.text }} />
      <i className="thumb-line is-short" style={{ background: preview.muted }} />
    </span>
  )
}

export function SettingsDialog({ onClose }: Props): React.JSX.Element {
  const { t, locale, theme, setLocale, setTheme } = useSettings()
  const names = themeLabels[locale]
  const dialogRef = useRef<HTMLDialogElement>(null)
  const doneRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    doneRef.current?.focus()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="modal settings-modal"
      aria-label={t.settings}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal-body">
        <h2>{t.settings}</h2>

        <section className="settings-block">
          <h3>{t.appearance}</h3>
          <div className="theme-grid" role="radiogroup" aria-label={t.appearance}>
            {themes.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={theme === item.id}
                className={`theme-card ${theme === item.id ? 'is-on' : ''}`}
                onClick={() => setTheme(item.id)}
              >
                <ThemeThumb preview={item.preview} />
                <span className="theme-name">{names[item.id]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-block">
          <h3>{t.language}</h3>
          <div className="segmented" role="radiogroup" aria-label={t.language}>
            {locales.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={locale === item.id}
                className={locale === item.id ? 'is-on' : ''}
                onClick={() => setLocale(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <div className="modal-actions">
          <button ref={doneRef} type="button" className="primary" onClick={onClose}>
            {t.done}
          </button>
        </div>
      </div>
    </dialog>
  )
}
