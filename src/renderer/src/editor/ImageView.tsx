import { useRef, useState } from 'react'
import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { useSettings } from '../settings-context'
import { Icon, type IconName } from './icons'
import { IMAGE_MIN_WIDTH, normalizeAlign, normalizeWidth, type ImageAlign } from './image-extension'

type Corner = 'nw' | 'ne' | 'sw' | 'se'
const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se']

/**
 * Node view da imagem: contorno ao selecionar, 4 alças de redimensionamento
 * (largura entre 80px e a largura do contêiner; a altura segue a proporção)
 * e barrinha com alinhamento e remover.
 */
export function ImageView({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode
}: ReactNodeViewProps): React.JSX.Element {
  const { t } = useSettings()
  const wrapper = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const [dragWidth, setDragWidth] = useState<number | null>(null)

  const width = normalizeWidth(node.attrs.width)
  const align = normalizeAlign(node.attrs.align)
  const shownWidth = dragWidth ?? width

  const startResize = (corner: Corner) => (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const image = img.current
    if (!image) return
    const startX = event.clientX
    const startWidth = image.getBoundingClientRect().width
    const maxWidth = wrapper.current?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY
    // alças da esquerda invertem o sentido; centralizada cresce dos dois lados
    const direction = corner.endsWith('e') ? 1 : -1
    const factor = align === 'center' ? 2 : 1
    let last = Math.round(startWidth)

    const move = (moveEvent: MouseEvent): void => {
      const delta = (moveEvent.clientX - startX) * direction * factor
      last = Math.round(Math.min(maxWidth, Math.max(IMAGE_MIN_WIDTH, startWidth + delta)))
      setDragWidth(last)
    }
    const up = (): void => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      setDragWidth(null)
      updateAttributes({ width: last })
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const aligns: { id: ImageAlign; icon: IconName; title: string }[] = [
    { id: 'left', icon: 'alignLeft', title: t.alignLeft },
    { id: 'center', icon: 'alignCenter', title: t.alignCenter },
    { id: 'right', icon: 'alignRight', title: t.alignRight }
  ]

  return (
    <NodeViewWrapper
      ref={wrapper}
      className={`img-view${selected ? ' is-selected' : ''}${dragWidth ? ' is-resizing' : ''}`}
      data-align={align}
    >
      <span className="img-box">
        <img
          ref={img}
          src={node.attrs.src}
          alt={node.attrs.alt ?? ''}
          title={node.attrs.title ?? undefined}
          draggable={false}
          data-drag-handle
          style={shownWidth ? { width: shownWidth } : undefined}
        />
        {selected && editor.isEditable && (
          <>
            {CORNERS.map((corner) => (
              <span
                key={corner}
                className={`img-handle ${corner}`}
                title={t.resizeImage}
                onMouseDown={startResize(corner)}
              />
            ))}
            <span className="img-bar" contentEditable={false}>
              {aligns.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.title}
                  className={item.id === align ? 'is-on' : ''}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => updateAttributes({ align: item.id })}
                >
                  <Icon name={item.icon} />
                </button>
              ))}
              <span className="sep" />
              <button
                type="button"
                title={t.removeImage}
                className="is-danger"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => deleteNode()}
              >
                <Icon name="trash" />
              </button>
            </span>
          </>
        )}
      </span>
    </NodeViewWrapper>
  )
}
