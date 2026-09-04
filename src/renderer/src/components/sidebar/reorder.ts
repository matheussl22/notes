/**
 * Lógica pura de reordenação da barra lateral — sem React nem DOM.
 * Usada pelo arrastar de notas/projetos e pelos atalhos Alt+↑ / Alt+↓.
 * Todas as funções devolvem cópias; nunca alteram a lista recebida.
 */

export type DropPlace = 'before' | 'after'

/** Metade de cima do alvo → inserir antes dele; metade de baixo (ou o meio exato) → depois. */
export function dropPlaceFromPointer(
  rect: { top: number; height: number },
  clientY: number
): DropPlace {
  return clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

/**
 * Índice em que um item novo entraria em `ids` para ficar antes/depois de `toId`,
 * sem considerar a remoção de nenhum item. -1 se `toId` não está na lista.
 */
export function insertionIndex(ids: readonly number[], toId: number, place: DropPlace): number {
  const index = ids.indexOf(toId)
  if (index < 0) return -1
  return place === 'before' ? index : index + 1
}

/**
 * Move `fromId` para antes/depois de `toId` e devolve a ordem completa resultante.
 * Ids desconhecidos, ou soltar em cima de si mesmo, devolvem a ordem original.
 */
export function moveItem(
  ids: readonly number[],
  fromId: number,
  toId: number,
  place: DropPlace
): number[] {
  const from = ids.indexOf(fromId)
  const target = insertionIndex(ids, toId, place)
  if (from < 0 || target < 0 || fromId === toId) return [...ids]
  const without = ids.filter((id) => id !== fromId)
  // depois de retirar `fromId`, tudo que estava à frente dele anda uma casa
  const at = target > from ? target - 1 : target
  without.splice(at, 0, fromId)
  return without
}

/**
 * Move `id` uma casa para cima (-1) ou para baixo (+1) considerando apenas os itens
 * em `visible` (ex.: notas arquivadas escondidas não contam como vizinhas), mas
 * devolve a ordem completa de `ids`. Nas pontas, devolve a ordem original.
 */
export function moveAdjacent(
  ids: readonly number[],
  id: number,
  direction: -1 | 1,
  visible: readonly number[] = ids
): number[] {
  const at = visible.indexOf(id)
  const neighbor = at < 0 ? undefined : visible[at + direction]
  if (neighbor === undefined) return [...ids]
  return moveItem(ids, id, neighbor, direction < 0 ? 'before' : 'after')
}

export function sameOrder(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index])
}
