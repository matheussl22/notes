import { clampRatio } from '../workspace'

type Props = {
  /** elemento cuja largura define a proporção (a área de trabalho) */
  containerRef: React.RefObject<HTMLElement | null>
  onChange: (ratio: number) => void
  /** fim do arraste: hora de persistir */
  onCommit: () => void
  onReset: () => void
  onDragging: (dragging: boolean) => void
  title: string
}

/**
 * Alça vertical entre os dois painéis. Ocupa 1px no layout; a zona de clique
 * (5px) fica por cima da borda via ::after. Pointer capture garante que o
 * arraste continue mesmo saindo da alça.
 */
export function SplitDivider({
  containerRef,
  onChange,
  onCommit,
  onReset,
  onDragging,
  title
}: Props): React.JSX.Element {
  const ratioAt = (clientX: number): number | null => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return null
    return clampRatio((clientX - rect.left) / rect.width)
  }

  const stop = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    onDragging(false)
    onCommit()
  }

  return (
    <div
      className="split-divider"
      role="separator"
      aria-orientation="vertical"
      title={title}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        onDragging(true)
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
        const ratio = ratioAt(event.clientX)
        if (ratio !== null) onChange(ratio)
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onDoubleClick={onReset}
    />
  )
}
