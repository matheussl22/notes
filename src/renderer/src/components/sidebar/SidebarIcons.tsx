/* Ícones miúdos da barra lateral (12–14px, traço 1.5), para caber em linhas de 24px. */

const tiny = {
  width: 12,
  height: 12,
  viewBox: '0 0 12 12',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
}

const small = { ...tiny, width: 14, height: 14, viewBox: '0 0 14 14' }

/** Seta para a direita; o CSS gira 90° quando o projeto está expandido. */
export function IconChevronSmall(): React.JSX.Element {
  return (
    <svg {...tiny}>
      <path d="m4.5 2.5 3.5 3.5-3.5 3.5" />
    </svg>
  )
}

export function IconPlusSmall(): React.JSX.Element {
  return (
    <svg {...small}>
      <path d="M7 2.5v9M2.5 7h9" />
    </svg>
  )
}

export function IconSettingsSmall(): React.JSX.Element {
  return (
    <svg {...small}>
      <circle cx="7" cy="7" r="1.9" />
      <path d="M7 1.9v1.2M7 10.9v1.2M1.9 7h1.2M10.9 7h1.2M3.4 3.4l.85.85M9.75 9.75l.85.85M10.6 3.4l-.85.85M4.25 9.75l-.85.85" />
    </svg>
  )
}
