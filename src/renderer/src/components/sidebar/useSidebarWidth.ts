/**
 * Largura da barra lateral: alça na borda direita arrasta entre MIN e MAX,
 * duplo clique volta ao padrão, tudo persistido em localStorage.
 *
 * A largura é aplicada direto na variável CSS `--sidebar-w` a cada movimento
 * (sem re-render por frame) e gravada só ao soltar.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { applyWidth, clampWidth, DEFAULT_WIDTH, readWidth, writeWidth } from './storage'

// aplica a largura salva no carregamento do módulo, antes do primeiro paint
applyWidth(readWidth())

export type ResizeHandleProps = {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  onDoubleClick: () => void
}

export function useSidebarWidth(): { handleProps: ResizeHandleProps; resizing: boolean } {
  const [resizing, setResizing] = useState(false)
  const width = useRef(readWidth())
  const session = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null)
  const cleanup = useRef<(() => void) | null>(null)

  useEffect(() => () => cleanup.current?.(), [])

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || session.current) return
    event.preventDefault()
    const handle = event.currentTarget
    session.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: width.current
    }
    try {
      handle.setPointerCapture(event.pointerId)
    } catch {
      // sem captura o arrasto ainda funciona enquanto o ponteiro estiver sobre a janela
    }
    setResizing(true)

    const finish = (): void => {
      cleanup.current?.()
      cleanup.current = null
      session.current = null
      try {
        handle.releasePointerCapture(event.pointerId)
      } catch {
        // já solto
      }
      writeWidth(width.current)
      setResizing(false)
    }
    const onMove = (move: PointerEvent): void => {
      const current = session.current
      if (!current || move.pointerId !== current.pointerId) return
      width.current = clampWidth(current.startWidth + (move.clientX - current.startX))
      applyWidth(width.current)
    }
    const onUp = (up: PointerEvent): void => {
      if (up.pointerId === session.current?.pointerId) finish()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    cleanup.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const onDoubleClick = useCallback(() => {
    width.current = DEFAULT_WIDTH
    applyWidth(DEFAULT_WIDTH)
    writeWidth(DEFAULT_WIDTH)
  }, [])

  return { handleProps: { onPointerDown, onDoubleClick }, resizing }
}
