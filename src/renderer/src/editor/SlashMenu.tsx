import { useEffect, useRef } from 'react'
import { Icon } from './icons'
import type { SlashCommand } from './slash-commands'

export type SlashMenuProps = {
  items: SlashCommand[]
  selected: number
  empty: string
  onPick: (item: SlashCommand) => void
}

/** Lista do menu "/". Posicionada pelo plugin de sugestão (`props.mount`). */
export function SlashMenu({ items, selected, empty, onPick }: SlashMenuProps): React.JSX.Element {
  const list = useRef<HTMLDivElement>(null)

  // mantém o item selecionado visível ao navegar com as setas
  useEffect(() => {
    const el = list.current?.children[selected] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div className="slash-menu" role="listbox">
      {items.length === 0 && <div className="slash-empty">{empty}</div>}
      <div ref={list}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={index === selected}
            className={index === selected ? 'is-selected' : ''}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(item)}
          >
            <span className="slash-icon">
              <Icon name={item.icon} />
            </span>
            <span className="slash-text">
              <span className="slash-label">{item.label}</span>
              <span className="slash-desc">{item.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
