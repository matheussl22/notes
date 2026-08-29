import { locales } from '../i18n'
import { useSettings } from '../settings'
import { themeLabels, themes } from '../theme'

type Props = {
  onClose: () => void
}

export function SettingsDialog({ onClose }: Props): React.JSX.Element {
  const { t, locale, theme, setLocale, setTheme } = useSettings()
  const names = themeLabels[locale]

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div className="modal settings-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{t.settings}</h2>

        <section className="settings-block">
          <h3>{t.appearance}</h3>
          <div className="theme-grid">
            {themes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`theme-card ${theme === item.id ? 'is-on' : ''}`}
                onClick={() => setTheme(item.id)}
              >
                <span className="theme-swatches">
                  {item.swatch.map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
                {names[item.id]}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-block">
          <h3>{t.language}</h3>
          <div className="lang-row">
            {locales.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`lang-card ${locale === item.id ? 'is-on' : ''}`}
                onClick={() => setLocale(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <div className="modal-actions">
          <button type="button" className="primary" onClick={onClose}>
            {t.done}
          </button>
        </div>
      </div>
    </div>
  )
}
