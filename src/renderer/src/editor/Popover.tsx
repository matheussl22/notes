import { useEffect, useRef, useState } from 'react'

type Props = {
  /** conteúdo do botão que abre o popover */
  label: React.ReactNode
  title?: string
  active?: boolean
  disabled?: boolean
  /** classe extra do botão (ex.: `tb-select` para o dropdown de estilo) */
  buttonClass?: string
  /** classe extra do painel */
  panelClass?: string
  children: (close: () => void) => React.ReactNode
}

/**
 * Popover pequeno da toolbar. Fecha com Esc ou clique fora. O `mousedown` no
 * painel é cancelado para o editor não perder a seleção.
 */
export function Popover({
  label,
  title,
  active,
  disabled,
  buttonClass,
  panelClass,
  children
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const classes = [buttonClass, active ? 'is-on' : '', open ? 'is-open' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className="tb-drop" ref={root}>
      <button
        type="button"
        title={title}
        disabled={disabled}
        className={classes}
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>
      {open && (
        <div
          className={['tb-pop', panelClass].filter(Boolean).join(' ')}
          onMouseDown={(event) => event.preventDefault()}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
