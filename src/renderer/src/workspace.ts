/**
 * Estado da área de trabalho: um ou dois painéis lado a lado, cada um mostrando
 * um projeto, uma nota ou nada. A sidebar sempre age sobre o painel ativo.
 *
 * Regras:
 * - máximo de 2 painéis;
 * - a mesma nota nunca fica aberta em dois painéis (dois editores brigariam
 *   pelo mesmo documento). Selecionar uma nota já aberta no outro painel apenas
 *   ativa aquele painel;
 * - fechar um painel deixa sempre pelo menos um.
 *
 * Tudo aqui é puro (sem React, sem DOM) para ser testável em Node.
 */

export type Selection =
  | { kind: 'none' }
  | { kind: 'project'; projectId: number }
  | { kind: 'note'; projectId: number; noteId: number }

export type Workspace = {
  panes: Selection[]
  active: number
}

export const MAX_PANES = 2

export const NONE: Selection = { kind: 'none' }

export const initialWorkspace: Workspace = { panes: [NONE], active: 0 }

export function sameSelection(a: Selection, b: Selection): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'none') return true
  if (a.kind === 'project' && b.kind === 'project') return a.projectId === b.projectId
  if (a.kind === 'note' && b.kind === 'note') return a.noteId === b.noteId
  return false
}

export function activeSelection(ws: Workspace): Selection {
  return ws.panes[ws.active] ?? NONE
}

export function paneIndexShowing(ws: Workspace, sel: Selection): number {
  return ws.panes.findIndex((pane) => sel.kind !== 'none' && sameSelection(pane, sel))
}

/** Abre `sel` no painel ativo (ou ativa o painel que já a mostra). */
export function selectInActive(ws: Workspace, sel: Selection): Workspace {
  const already = paneIndexShowing(ws, sel)
  if (already >= 0) return { ...ws, active: already }
  const panes = ws.panes.map((pane, index) => (index === ws.active ? sel : pane))
  return { panes, active: ws.active }
}

/** Abre `sel` num painel específico (ex.: soltar uma nota sobre ele). */
export function openInPane(ws: Workspace, index: number, sel: Selection): Workspace {
  if (index < 0 || index >= ws.panes.length) return ws
  const already = paneIndexShowing(ws, sel)
  if (already >= 0) return { ...ws, active: already }
  return { panes: ws.panes.map((pane, i) => (i === index ? sel : pane)), active: index }
}

/** Abre `sel` num segundo painel. Se já houver dois, usa o painel que não está ativo. */
export function openInSplit(ws: Workspace, sel: Selection): Workspace {
  const already = paneIndexShowing(ws, sel)
  if (already >= 0) return { ...ws, active: already }
  if (ws.panes.length < MAX_PANES) {
    return { panes: [...ws.panes, sel], active: ws.panes.length }
  }
  const target = ws.active === 0 ? 1 : 0
  return { panes: ws.panes.map((pane, index) => (index === target ? sel : pane)), active: target }
}

/** Divide a tela duplicando o contexto do painel ativo (projeto da nota atual, ou vazio). */
export function splitActive(ws: Workspace): Workspace {
  if (ws.panes.length >= MAX_PANES) return ws
  const current = activeSelection(ws)
  const twin: Selection =
    current.kind === 'note' ? { kind: 'project', projectId: current.projectId } : NONE
  return { panes: [...ws.panes, twin], active: ws.panes.length }
}

/**
 * "Abrir ao lado" a partir do próprio painel: o conteúdo do painel `index` vai
 * para o outro lado (abrindo o segundo painel se preciso) e o lugar dele fica
 * com o projeto da nota (ou vazio). Com um só painel, o item vai para a direita.
 */
export function moveAside(ws: Workspace, index: number): Workspace {
  const current = ws.panes[index]
  if (!current || current.kind === 'none') return ws
  const twin: Selection =
    current.kind === 'note' ? { kind: 'project', projectId: current.projectId } : NONE
  if (ws.panes.length < MAX_PANES) return { panes: [twin, current], active: 1 }
  const other = index === 0 ? 1 : 0
  return { panes: ws.panes.map((_, i) => (i === index ? twin : current)), active: other }
}

export function closePane(ws: Workspace, index: number): Workspace {
  if (index < 0 || index >= ws.panes.length) return ws
  if (ws.panes.length <= 1) return { panes: [NONE], active: 0 }
  const panes = ws.panes.filter((_, i) => i !== index)
  return {
    panes,
    active: Math.min(ws.active > index ? ws.active - 1 : ws.active, panes.length - 1)
  }
}

/** Com dois painéis, fecha o que não está ativo; com um, não faz nada. */
export function closeOther(ws: Workspace): Workspace {
  if (ws.panes.length < 2) return ws
  return closePane(ws, ws.active === 0 ? 1 : 0)
}

export function setActive(ws: Workspace, index: number): Workspace {
  if (index < 0 || index >= ws.panes.length || index === ws.active) return ws
  return { ...ws, active: index }
}

export function swapPanes(ws: Workspace): Workspace {
  if (ws.panes.length !== 2) return ws
  return { panes: [ws.panes[1], ws.panes[0]], active: ws.active === 0 ? 1 : 0 }
}

/** Depois de apagar um projeto/nota, limpa os painéis que apontavam para ele. */
export function dropDeleted(
  ws: Workspace,
  gone: { projectId?: number; noteId?: number }
): Workspace {
  const panes = ws.panes.map((pane): Selection => {
    if (pane.kind === 'none') return pane
    if (gone.projectId !== undefined && pane.projectId === gone.projectId) return NONE
    if (gone.noteId !== undefined && pane.kind === 'note' && pane.noteId === gone.noteId) {
      return { kind: 'project', projectId: pane.projectId }
    }
    return pane
  })
  return { ...ws, panes }
}

/**
 * Remove seleções que não existem mais na árvore (ex.: estado restaurado do
 * localStorage depois que algo foi apagado).
 */
export function pruneAgainstTree(
  ws: Workspace,
  tree: { id: number; notes: { id: number }[] }[]
): Workspace {
  const panes = ws.panes.map((pane): Selection => {
    if (pane.kind === 'none') return pane
    const project = tree.find((item) => item.id === pane.projectId)
    if (!project) return NONE
    if (pane.kind === 'note' && !project.notes.some((note) => note.id === pane.noteId)) {
      return { kind: 'project', projectId: pane.projectId }
    }
    return pane
  })
  return { panes, active: Math.min(ws.active, panes.length - 1) }
}

/* ------------------------------------------------------------------------ */
/* Persistência (localStorage). Tudo o que entra é validado; lixo vira null.  */
/* ------------------------------------------------------------------------ */

export const WORKSPACE_KEY = 'notes.workspace'
export const RATIO_KEY = 'notes.workspace.ratio'

export const MIN_RATIO = 0.25
export const MAX_RATIO = 0.75
export const DEFAULT_RATIO = 0.5

function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function parseSelection(value: unknown): Selection | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.kind === 'none') return NONE
  if (raw.kind === 'project' && isId(raw.projectId)) {
    return { kind: 'project', projectId: raw.projectId }
  }
  if (raw.kind === 'note' && isId(raw.projectId) && isId(raw.noteId)) {
    return { kind: 'note', projectId: raw.projectId, noteId: raw.noteId }
  }
  return null
}

export function serializeWorkspace(ws: Workspace): string {
  return JSON.stringify({ panes: ws.panes, active: ws.active })
}

/**
 * Lê um workspace salvo. Devolve null se estiver ausente ou inválido; o
 * chamador então usa `initialWorkspace`. Ids inexistentes ficam para
 * `pruneAgainstTree` resolver quando a árvore chegar.
 */
export function parseWorkspace(raw: string | null | undefined): Workspace | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const { panes, active } = data as Record<string, unknown>
  if (!Array.isArray(panes) || panes.length < 1 || panes.length > MAX_PANES) return null
  const parsed = panes.map(parseSelection)
  if (parsed.some((pane) => pane === null)) return null
  const list = parsed as Selection[]
  // a mesma nota nunca pode estar nos dois painéis
  if (list.length === 2 && list[0].kind === 'note' && sameSelection(list[0], list[1])) return null
  const index = typeof active === 'number' && Number.isInteger(active) ? active : 0
  return { panes: list, active: Math.min(Math.max(index, 0), list.length - 1) }
}

export function clampRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return DEFAULT_RATIO
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio))
}

export function parseRatio(raw: string | null | undefined): number {
  if (!raw) return DEFAULT_RATIO
  const value = Number(raw)
  return Number.isFinite(value) ? clampRatio(value) : DEFAULT_RATIO
}

/* ------------------------------------------------------------------------ */
/* Integração com a sidebar e atalhos                                        */
/* ------------------------------------------------------------------------ */

/** Payload `text/note` que a sidebar coloca no dataTransfer ao arrastar uma nota. */
export function parseNoteTransfer(raw: string | null | undefined): Selection | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    if (data && isId(data.projectId) && isId(data.noteId)) {
      return { kind: 'note', projectId: data.projectId, noteId: data.noteId }
    }
  } catch {
    // não era JSON nosso
  }
  return null
}

/**
 * Onde criar uma nota nova (Ctrl+N): projeto do painel ativo, senão do outro
 * painel, senão o primeiro da árvore. `null` quando não há projeto algum.
 */
export function projectIdForNewNote(ws: Workspace, tree: { id: number }[]): number | null {
  const ordered = [activeSelection(ws), ...ws.panes.filter((_, i) => i !== ws.active)]
  for (const pane of ordered) if (pane.kind !== 'none') return pane.projectId
  return tree[0]?.id ?? null
}
