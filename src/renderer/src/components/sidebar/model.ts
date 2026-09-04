/**
 * Modelo puro das linhas da árvore (sem React nem DOM): quais notas aparecem,
 * quais linhas são focáveis e em que ordem. Alimenta o roving tabindex e as setas.
 */
import type { ProjectTree } from '../../../../shared/types'

export type TreeNote = ProjectTree['notes'][number]

export type RowKind = 'project' | 'note' | 'archived'

/** Uma linha focável da árvore. `projectId` é o projeto dono (o próprio, no caso de projeto). */
export type Row = { key: string; kind: RowKind; id: number; projectId: number }

export const projectKey = (id: number): string => `p:${id}`
export const noteKey = (id: number): string => `n:${id}`
export const archivedKey = (id: number): string => `a:${id}`

export function parseKey(key: string): { kind: RowKind; id: number } | null {
  const match = /^([pna]):(\d+)$/.exec(key)
  if (!match) return null
  const kind: RowKind = match[1] === 'p' ? 'project' : match[1] === 'n' ? 'note' : 'archived'
  return { kind, id: Number(match[2]) }
}

export function countActive(notes: readonly TreeNote[]): number {
  return notes.filter((note) => !note.completed).length
}

/**
 * Notas listadas de um projeto: as ativas sempre; as arquivadas só quando o
 * usuário pediu para vê-las ou quando estão abertas num painel (senão a nota
 * selecionada sumiria da lista ao ser arquivada).
 */
export function visibleNotes(
  notes: readonly TreeNote[],
  showArchived: boolean,
  openNoteIds: ReadonlySet<number>
): TreeNote[] {
  return notes.filter((note) => showArchived || !note.completed || openNoteIds.has(note.id))
}

export type RowContext = {
  collapsed: ReadonlySet<number>
  archivedOpen: ReadonlySet<number>
  openNoteIds: ReadonlySet<number>
  /** projeto da seleção do painel ativo, se houver */
  activeProjectId: number | null
}

/** O toggle "N arquivada(s)" aparece no projeto ativo, ou enquanto as arquivadas estão à mostra. */
export function showsArchivedToggle(project: ProjectTree, ctx: RowContext): boolean {
  if (ctx.collapsed.has(project.id)) return false
  const archived = project.notes.length - countActive(project.notes)
  if (archived === 0) return false
  return ctx.activeProjectId === project.id || ctx.archivedOpen.has(project.id)
}

/** Linhas focáveis na ordem em que aparecem na tela. */
export function rowList(tree: readonly ProjectTree[], ctx: RowContext): Row[] {
  const rows: Row[] = []
  for (const project of tree) {
    rows.push({
      key: projectKey(project.id),
      kind: 'project',
      id: project.id,
      projectId: project.id
    })
    if (ctx.collapsed.has(project.id)) continue
    const notes = visibleNotes(project.notes, ctx.archivedOpen.has(project.id), ctx.openNoteIds)
    for (const note of notes) {
      rows.push({ key: noteKey(note.id), kind: 'note', id: note.id, projectId: project.id })
    }
    if (showsArchivedToggle(project, ctx)) {
      rows.push({
        key: archivedKey(project.id),
        kind: 'archived',
        id: project.id,
        projectId: project.id
      })
    }
  }
  return rows
}
