import { useEffect, useRef, useState } from 'react'
import { posToDOMRect, type Editor } from '@tiptap/react'
import { useSettings } from '../settings-context'
import { Icon } from './icons'
import { applyLink, removeLink, type LinkTarget } from './link-target'

type Props = {
  editor: Editor
  target: LinkTarget
  /** elemento em relação ao qual o popover é posicionado (`.editor`) */
  container: React.RefObject<HTMLElement | null>
  onClose: () => void
}

const WIDTH = 300

/** Popover pequeno ancorado à seleção: URL, Aplicar, Remover. Enter aplica, Esc fecha. */
export function LinkPopover({ editor, target, container, onClose }: Props): React.JSX.Element {
  const { t } = useSettings()
  const [value, setValue] = useState(target.href)
  const input = useRef<HTMLInputElement>(null)
  const root = useRef<HTMLDivElement>(null)

  // posição: logo abaixo da seleção, sem sair do painel
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  useEffect(() => {
    const base = container.current?.getBoundingClientRect()
    if (!base) return
    const rect = posToDOMRect(editor.view, target.from, target.to)
    const left = Math.max(0, Math.min(rect.left - base.left, base.width - WIDTH))
    setPos({ top: rect.bottom - base.top + 6, left })
  }, [editor, target, container])

  useEffect(() => {
    input.current?.focus()
    input.current?.select()
    const onDown = (event: MouseEvent): void => {
      if (!root.current?.contains(event.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const apply = (): void => {
    applyLink(editor, target, value)
    onClose()
  }

  const remove = (): void => {
    removeLink(editor, target)
    onClose()
  }

  return (
    <div
      ref={root}
      className="link-pop"
      style={{ top: pos.top, left: pos.left, width: WIDTH }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
          editor.commands.focus()
        }
      }}
    >
      <Icon name="link" />
      <input
        ref={input}
        type="url"
        value={value}
        placeholder={t.linkUrl}
        spellCheck={false}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            apply()
          }
        }}
      />
      <button type="button" className="primary" onClick={apply}>
        {t.apply}
      </button>
      {target.href && (
        <button type="button" title={t.removeLink} onClick={remove}>
          <Icon name="close" />
        </button>
      )}
    </div>
  )
}
