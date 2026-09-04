import { useEffect, useRef, useState } from 'react'
import { IconMore } from './Icons'

type Props = {
  label: string
  children: React.ReactNode
}

/**
 * Menu "···" baseado em <details>: sem JS para abrir, e fecha ao clicar fora,
 * ao pressionar Esc ou ao escolher um item. Os itens são <button>s filhos;
 * use <hr className="menu-sep" /> para separar.
 */
export function MoreMenu({ label, children }: Props): React.JSX.Element {
  const ref = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = (): void => ref.current?.removeAttribute('open')
    const onPointerDown = (event: PointerEvent): void => {
      if (!ref.current?.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  return (
    <details ref={ref} className="more" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary title={label} aria-label={label}>
        <IconMore />
      </summary>
      <div
        className="more-menu"
        role="menu"
        onClick={(event) => {
          // qualquer item escolhido fecha o menu
          if ((event.target as HTMLElement).closest('button')) {
            ref.current?.removeAttribute('open')
          }
        }}
      >
        {children}
      </div>
    </details>
  )
}
