/**
 * Arrastar para reordenar com pointer events (HTML5 DnD é imprevisível no Electron).
 *
 * Mecânica:
 * - pointerdown registra o gesto; só vira arrasto depois de 4px de movimento,
 *   então um clique simples continua sendo clique;
 * - ao virar arrasto, captura o ponteiro no item de origem (eventos continuam
 *   chegando mesmo fora da janela) e liga um loop de rolagem automática da `nav`;
 * - a cada movimento, `resolve` recebe o elemento sob o ponteiro e decide o alvo
 *   (a semântica — mesmo projeto, linha antes/depois — fica com o componente);
 * - pointerup solta; Esc cancela; o clique sintético que segue um arrasto é engolido.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { DropPlace } from './reorder'

export type DragKind = 'note' | 'project'

export type DragItem = {
  kind: DragKind
  id: number
  /** projeto dono da nota; o próprio id no caso de projeto */
  projectId: number
}

export type DropTarget = { id: number; place: DropPlace }

export type Resolution = {
  target: DropTarget | null
  /** ponteiro sobre um lugar proibido (ex.: outro projeto): cursor `not-allowed`, sem linha */
  invalid: boolean
  /** ponteiro sobre a área de trabalho: soltar abre o item num painel ao lado */
  open: boolean
}

export type DragState = DragItem & Resolution

export type ResolveTarget = (element: Element | null, item: DragItem, clientY: number) => Resolution

type Options = {
  /** contêiner rolável (a `nav`) para a rolagem automática nas bordas */
  scrollRef: RefObject<HTMLElement | null>
  resolve: ResolveTarget
  onDrop: (item: DragItem, target: DropTarget) => void
  /** o item foi solto sobre a área de trabalho (`Resolution.open`) */
  onOpen: (item: DragItem) => void
}

type Session = {
  item: DragItem
  element: HTMLElement
  pointerId: number
  startX: number
  startY: number
  x: number
  y: number
  dragging: boolean
  state: DragState | null
  raf: number
  cleanup: () => void
}

const THRESHOLD = 4
/** faixa junto às bordas da nav em que a rolagem automática atua */
const EDGE = 28
const MAX_SPEED = 14

export const NO_TARGET: Resolution = { target: null, invalid: false, open: false }
export const INVALID_TARGET: Resolution = { target: null, invalid: true, open: false }
export const OPEN_TARGET: Resolution = { target: null, invalid: false, open: true }

function sameResolution(a: DragState | null, b: DragState): boolean {
  if (!a) return false
  if (a.invalid !== b.invalid || a.open !== b.open) return false
  if (a.target === null || b.target === null) return a.target === b.target
  return a.target.id === b.target.id && a.target.place === b.target.place
}

export function useReorderDrag({ scrollRef, resolve, onDrop, onOpen }: Options): {
  drag: DragState | null
  startPress: (event: React.PointerEvent<HTMLElement>, item: DragItem) => void
  /** true (e consome) se o clique que acabou de chegar foi o fim de um arrasto */
  consumeDragClick: () => boolean
} {
  const [drag, setDrag] = useState<DragState | null>(null)
  const session = useRef<Session | null>(null)
  const suppressClick = useRef(false)
  // `resolve`/`onDrop`/`onOpen` mudam a cada render do componente; os handlers leem sempre a versão atual
  const latest = useRef({ resolve, onDrop, onOpen })
  useEffect(() => {
    latest.current = { resolve, onDrop, onOpen }
  })

  const finish = useCallback((commit: boolean) => {
    const current = session.current
    if (!current) return
    session.current = null
    current.cleanup()
    cancelAnimationFrame(current.raf)
    try {
      current.element.releasePointerCapture(current.pointerId)
    } catch {
      // nunca capturado (clique simples) ou já solto
    }
    if (!current.dragging) return
    // o navegador ainda dispara `click` no item de origem depois do pointerup
    suppressClick.current = true
    window.setTimeout(() => {
      suppressClick.current = false
    }, 0)
    const state = current.state
    if (commit && state && !state.invalid) {
      if (state.target) latest.current.onDrop(current.item, state.target)
      else if (state.open) latest.current.onOpen(current.item)
    }
    setDrag(null)
  }, [])

  useEffect(() => () => finish(false), [finish])

  const startPress = useCallback(
    (event: React.PointerEvent<HTMLElement>, item: DragItem) => {
      if (event.button !== 0 || session.current) return
      const element = event.currentTarget
      const current: Session = {
        item,
        element,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        dragging: false,
        state: null,
        raf: 0,
        cleanup: () => {}
      }
      session.current = current

      const update = (): void => {
        const under = document.elementFromPoint(current.x, current.y)
        const resolution = latest.current.resolve(under, current.item, current.y)
        const next: DragState = { ...current.item, ...resolution }
        if (sameResolution(current.state, next)) return
        current.state = next
        setDrag(next)
      }

      // rolagem automática enquanto o ponteiro fica junto à borda de cima/baixo da nav
      const tick = (): void => {
        const nav = scrollRef.current
        if (nav && current.dragging) {
          const rect = nav.getBoundingClientRect()
          let delta = 0
          if (current.y < rect.top + EDGE) {
            delta = -Math.ceil(((rect.top + EDGE - current.y) / EDGE) * MAX_SPEED)
          } else if (current.y > rect.bottom - EDGE) {
            delta = Math.ceil(((current.y - (rect.bottom - EDGE)) / EDGE) * MAX_SPEED)
          }
          if (delta !== 0) {
            const before = nav.scrollTop
            nav.scrollTop += delta
            if (nav.scrollTop !== before) update()
          }
        }
        current.raf = requestAnimationFrame(tick)
      }

      const onMove = (move: PointerEvent): void => {
        if (move.pointerId !== current.pointerId) return
        if (!current.dragging) {
          const dx = Math.abs(move.clientX - current.startX)
          const dy = Math.abs(move.clientY - current.startY)
          if (dx < THRESHOLD && dy < THRESHOLD) return
          current.dragging = true
          try {
            element.setPointerCapture(current.pointerId)
          } catch {
            // sem captura o arrasto segue funcionando dentro da janela
          }
          current.raf = requestAnimationFrame(tick)
        }
        current.x = move.clientX
        current.y = move.clientY
        update()
      }
      const onUp = (up: PointerEvent): void => {
        if (up.pointerId === current.pointerId) finish(true)
      }
      const onCancel = (cancel: PointerEvent): void => {
        if (cancel.pointerId === current.pointerId) finish(false)
      }
      const onKey = (key: KeyboardEvent): void => {
        if (key.key !== 'Escape' || !current.dragging) return
        key.preventDefault()
        key.stopPropagation()
        finish(false)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
      window.addEventListener('keydown', onKey, true)
      current.cleanup = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
        window.removeEventListener('keydown', onKey, true)
      }
    },
    [finish, scrollRef]
  )

  const consumeDragClick = useCallback(() => {
    if (!suppressClick.current) return false
    suppressClick.current = false
    return true
  }, [])

  return { drag, startPress, consumeDragClick }
}
