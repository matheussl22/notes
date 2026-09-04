/**
 * Persistência local da barra lateral (largura e projetos recolhidos).
 * `clampWidth` é puro; o resto só toca `localStorage`/`document` quando existem,
 * para que os módulos possam ser importados nos testes em Node.
 */

export const WIDTH_KEY = 'notes.sidebar.width'
export const COLLAPSED_KEY = 'notes.sidebar.collapsed'

export const MIN_WIDTH = 180
export const MAX_WIDTH = 420
export const DEFAULT_WIDTH = 220

/** Aceita número ou texto ("264px"); fora da faixa ou inválido cai no padrão/limite. */
export function clampWidth(value: unknown): number {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value) : NaN
  if (!Number.isFinite(parsed)) return DEFAULT_WIDTH
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(parsed)))
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readWidth(): number {
  return clampWidth(storage()?.getItem(WIDTH_KEY))
}

export function writeWidth(width: number): void {
  storage()?.setItem(WIDTH_KEY, String(clampWidth(width)))
}

/** Aplica a largura na variável que a grade do app usa (`.app` lê `--sidebar-w`). */
export function applyWidth(width: number): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--sidebar-w', `${clampWidth(width)}px`)
}

export function readCollapsed(): number[] {
  try {
    const raw = storage()?.getItem(COLLAPSED_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => typeof id === 'number' && Number.isInteger(id))
      : []
  } catch {
    return []
  }
}

export function writeCollapsed(ids: Iterable<number>): void {
  storage()?.setItem(COLLAPSED_KEY, JSON.stringify([...ids]))
}
