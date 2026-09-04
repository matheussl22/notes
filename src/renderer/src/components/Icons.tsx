const props = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
}

export function IconPlus(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconMore(): React.JSX.Element {
  return (
    <svg {...props}>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconClose(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconSettings(): React.JSX.Element {
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.5v1.6M12 17.9v1.6M4.5 12h1.6M17.9 12h1.6M6.4 6.4l1.1 1.1M16.5 16.5l1.1 1.1M17.6 6.4l-1.1 1.1M7.5 16.5l-1.1 1.1" />
    </svg>
  )
}

export function IconSplit(): React.JSX.Element {
  return (
    <svg {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M12 5v14" />
    </svg>
  )
}

export function IconChevron(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function IconGrip(): React.JSX.Element {
  return (
    <svg {...props}>
      <circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Trocar os lados dos painéis. */
export function IconSwap(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d="M4 9h13M13 5l4 4-4 4M20 15H7M11 11l-4 4 4 4" />
    </svg>
  )
}

/** Seta para baixo (seções recolhíveis). */
export function IconChevronDown(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/* Ícones por tipo de arquivo (anexos). Mesma folha com dobra; muda só o miolo. */
const sheet =
  'M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5L14 3z'
const fold = 'M14 3v4.5h4.5'

export function IconFile(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d={sheet} />
      <path d={fold} />
    </svg>
  )
}

export function IconFileText(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d={sheet} />
      <path d={fold} />
      <path d="M9 12h6M9 15.5h6" />
    </svg>
  )
}

export function IconFilePdf(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d={sheet} />
      <path d={fold} />
      <path d="M9 17v-5h1.6a1.5 1.5 0 0 1 0 3H9M14.5 17v-5" />
    </svg>
  )
}

export function IconFileSheet(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d={sheet} />
      <path d={fold} />
      <path d="M8.5 11.5h7v6h-7zM8.5 14.5h7M12 11.5v6" />
    </svg>
  )
}

export function IconFileImage(): React.JSX.Element {
  return (
    <svg {...props}>
      <path d={sheet} />
      <path d={fold} />
      <circle cx="10" cy="12.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="m8.5 18 2.6-3 2 2 1.6-1.6L16 17.5" />
    </svg>
  )
}
