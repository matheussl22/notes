/** Ícones do editor: 16px, traço 1.5, viewBox 24. Só SVG inline. */

export type IconName =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'highlight'
  | 'color'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'plus'
  | 'table'
  | 'image'
  | 'codeBlock'
  | 'quote'
  | 'divider'
  | 'link'
  | 'undo'
  | 'redo'
  | 'chevron'
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'rowAbove'
  | 'rowBelow'
  | 'colLeft'
  | 'colRight'
  | 'deleteRow'
  | 'deleteCol'
  | 'headerRow'
  | 'merge'
  | 'split'
  | 'trash'
  | 'calendar'
  | 'check'
  | 'close'

const paths: Record<IconName, React.JSX.Element> = {
  bold: (
    <>
      <path d="M7 5h6.2a3.2 3.2 0 0 1 0 6.4H7V5z" />
      <path d="M7 11.4h7a3.3 3.3 0 0 1 0 6.6H7v-6.6z" />
    </>
  ),
  italic: <path d="M11 5h8M5 19h8M15 5l-6 14" />,
  underline: <path d="M7 5v6a5 5 0 0 0 10 0V5M6 19h12" />,
  strike: (
    <>
      <path d="M5 12h14" />
      <path d="M8.3 8.6C8.6 6.6 10.2 5.4 12.1 5.4c1.9 0 3.4 1 3.7 2.5" />
      <path d="M8 15.4c.4 1.9 2 3.1 4.1 3.1 2.1 0 3.8-1.1 3.8-2.9 0-1-.4-1.8-1.3-2.4" />
    </>
  ),
  code: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />,
  highlight: (
    <>
      <path d="M4 20h6" />
      <path d="M15.5 4.5l4 4L9 19H5v-4L15.5 4.5z" />
      <path d="M13 7l4 4" />
    </>
  ),
  color: (
    <>
      <path d="M6 16 12 4l6 12M8 11.5h8" />
      <path d="M4 20h16" strokeWidth="2.5" />
    </>
  ),
  alignLeft: <path d="M4 7h16M4 12h10M4 17h16" />,
  alignCenter: <path d="M4 7h16M7 12h10M4 17h16" />,
  alignRight: <path d="M4 7h16M10 12h10M4 17h16" />,
  bulletList: (
    <>
      <circle cx="5" cy="7" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="17" r="1.1" fill="currentColor" stroke="none" />
      <path d="M9 7h11M9 12h11M9 17h11" />
    </>
  ),
  orderedList: (
    <>
      <path d="M10 7h10M10 12h10M10 17h10" />
      <path d="M4.2 5.6 5.6 4.8v4.4M4 9.2h3.2" />
      <path d="M4 13.6c.2-.8.8-1.3 1.6-1.3.9 0 1.5.6 1.5 1.3 0 1.4-3 2.2-3 3.9h3.1" />
    </>
  ),
  taskList: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 12.2 10.8 15 16.2 9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  table: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 10h18M9 10v9M15 10v9" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3 16 5-5 4 4 3-3 6 5" />
      <circle cx="15.5" cy="9.5" r="1.3" />
    </>
  ),
  codeBlock: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m9.5 9-3 3 3 3M14.5 9l3 3-3 3" />
    </>
  ),
  quote: <path d="M5 5v14M9.5 8H20M9.5 12h8M9.5 16h10" />,
  divider: <path d="M4 12h16M8 6.5h8M8 17.5h8" />,
  link: (
    <>
      <path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
      <path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
    </>
  ),
  undo: <path d="m9 14-4-4 4-4M5 10h9a5 5 0 0 1 0 10h-3" />,
  redo: <path d="m15 14 4-4-4-4M19 10h-9a5 5 0 0 0 0 10h3" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  text: <path d="M5 6h14M5 10.5h14M5 15h9" />,
  h1: (
    <>
      <path d="M4 5v14M4 12h7M11 5v14" />
      <path d="m16.5 9.5 2-1.5V19" />
    </>
  ),
  h2: (
    <>
      <path d="M3.5 5v14M3.5 12h7M10.5 5v14" />
      <path d="M15 10c0-1.3 1.1-2.3 2.5-2.3s2.5 1 2.5 2.2c0 2.4-5 3.7-5 7.1h5.2" />
    </>
  ),
  h3: (
    <>
      <path d="M3.5 5v14M3.5 12h7M10.5 5v14" />
      <path d="M15 9c.5-.9 1.4-1.4 2.5-1.4 1.5 0 2.5.9 2.5 2.1 0 1.1-.9 2-2.2 2.2 1.4.1 2.5 1 2.5 2.3 0 1.5-1.2 2.5-2.8 2.5-1.2 0-2.2-.6-2.6-1.5" />
    </>
  ),
  rowAbove: (
    <>
      <rect x="3" y="12" width="18" height="8" rx="1.5" />
      <path d="M3 16h18M12 9V3M9 6l3-3 3 3" />
    </>
  ),
  rowBelow: (
    <>
      <rect x="3" y="4" width="18" height="8" rx="1.5" />
      <path d="M3 8h18M12 15v6M9 18l3 3 3-3" />
    </>
  ),
  colLeft: (
    <>
      <rect x="12" y="3" width="8" height="18" rx="1.5" />
      <path d="M16 3v18M9 12H3M6 9l-3 3 3 3" />
    </>
  ),
  colRight: (
    <>
      <rect x="4" y="3" width="8" height="18" rx="1.5" />
      <path d="M8 3v18M15 12h6M18 9l3 3-3 3" />
    </>
  ),
  deleteRow: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M10 10l4 4M14 10l-4 4" />
    </>
  ),
  deleteCol: (
    <>
      <rect x="8" y="3" width="8" height="18" rx="1.5" />
      <path d="M10 10l4 4M14 10l-4 4" />
    </>
  ),
  headerRow: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 10h18" />
      <path d="M4.5 6h15v3h-15z" fill="currentColor" stroke="none" opacity="0.35" />
    </>
  ),
  merge: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 12h6M7 10l2 2-2 2M21 12h-6M17 10l-2 2 2 2" />
    </>
  ),
  split: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M12 5v14M9 12H5.5M7.5 10l-2 2 2 2M15 12h3.5M16.5 10l2 2-2 2" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  check: <path d="M5 12.5 9.5 17 19 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />
}

type Props = { name: IconName; size?: number }

export function Icon({ name, size = 16 }: Props): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  )
}
