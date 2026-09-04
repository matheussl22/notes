import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MemoryHit, ProjectTree } from '../../../shared/types'
import { displayNoteTitle, isUntitledNote } from '../i18n'
import { useSettings } from '../settings-context'
import { activeSelection, paneIndexShowing, type Selection, type Workspace } from '../workspace'
import {
  archivedKey,
  countActive,
  noteKey,
  projectKey,
  rowList,
  showsArchivedToggle,
  visibleNotes,
  type Row
} from './sidebar/model'
import {
  dropPlaceFromPointer,
  moveAdjacent,
  moveItem,
  sameOrder,
  type DropPlace
} from './sidebar/reorder'
import { IconChevronSmall, IconPlusSmall, IconSettingsSmall } from './sidebar/SidebarIcons'
import { useCollapsedProjects } from './sidebar/useCollapsedProjects'
import {
  INVALID_TARGET,
  NO_TARGET,
  OPEN_TARGET,
  useReorderDrag,
  type DragItem,
  type DropTarget,
  type Resolution,
  type ResolveTarget
} from './sidebar/useReorderDrag'
import { useSidebarWidth } from './sidebar/useSidebarWidth'

export type SidebarProps = {
  tree: ProjectTree[]
  workspace: Workspace
  /** abre a seleção no painel ativo */
  onSelect: (selection: Selection) => void
  /** abre a seleção num segundo painel (split) */
  onOpenInSplit: (selection: Selection) => void
  onCreateProject: () => void
  onCreateNote: (projectId: number) => void
  onOpenSettings: () => void
  /** ordem completa dos projetos; App persiste e recarrega */
  onReorderProjects: (ids: number[]) => void
  /** ordem completa das notas de um projeto; App persiste e recarrega */
  onReorderNotes: (projectId: number, ids: number[]) => void
}

const EMPTY_IDS: number[] = []

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Barra lateral: busca, árvore de projetos/notas (recolher, arrastar para
 * reordenar, teclado com roving tabindex), rodapé e alça de redimensionar.
 */
export function Sidebar({
  tree,
  workspace,
  onSelect,
  onOpenInSplit,
  onCreateProject,
  onCreateNote,
  onOpenSettings,
  onReorderProjects,
  onReorderNotes
}: SidebarProps): React.JSX.Element {
  const { t } = useSettings()
  const navRef = useRef<HTMLElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  /** elementos focáveis da árvore por chave de linha (roving tabindex) */
  const itemRefs = useRef(new Map<string, HTMLElement>())
  /** linha que deve receber o foco assim que existir no DOM (ex.: ao sair da busca) */
  const pendingFocus = useRef<string | null>(null)

  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<MemoryHit[]>([])
  const [pending, setPending] = useState(false)
  /** projetos com as notas arquivadas à mostra (só na sessão) */
  const [archivedOpen, setArchivedOpen] = useState<ReadonlySet<number>>(() => new Set())
  const [focusKey, setFocusKey] = useState<string | null>(null)

  const projectIds = useMemo(() => tree.map((item) => item.id), [tree])
  const { collapsed, toggle, expand, collapse } = useCollapsedProjects(projectIds)
  const { handleProps, resizing } = useSidebarWidth()

  const active = activeSelection(workspace)
  const activeProjectId = active.kind === 'none' ? null : active.projectId
  const activeNoteId = active.kind === 'note' ? active.noteId : null
  const openNoteIds = useMemo(
    () =>
      new Set(
        workspace.panes.flatMap((pane) => (pane.kind === 'note' ? [pane.noteId] : EMPTY_IDS))
      ),
    [workspace.panes]
  )

  const rows = useMemo<Row[]>(
    () => rowList(tree, { collapsed, archivedOpen, openNoteIds, activeProjectId }),
    [tree, collapsed, archivedOpen, openNoteIds, activeProjectId]
  )
  // linha com tabIndex 0: a última focada se ainda existe, senão a seleção ativa, senão a primeira
  const currentKey = useMemo(() => {
    if (focusKey && rows.some((row) => row.key === focusKey)) return focusKey
    const selected =
      active.kind === 'note'
        ? noteKey(active.noteId)
        : active.kind === 'project'
          ? projectKey(active.projectId)
          : null
    if (selected && rows.some((row) => row.key === selected)) return selected
    return rows[0]?.key ?? null
  }, [focusKey, rows, active])

  const searching = query.trim().length > 0

  // busca com debounce; `pending` evita mostrar "nada encontrado" antes da resposta
  useEffect(() => {
    const text = query.trim()
    if (!text) {
      setHits([])
      setPending(false)
      return
    }
    setPending(true)
    let cancelled = false
    const handle = window.setTimeout(async () => {
      const result = await window.api.memory.search(text)
      if (cancelled) return
      setHits(result)
      setPending(false)
    }, 180)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [query])

  // a nota do painel ativo nunca fica escondida dentro de um projeto recolhido
  useEffect(() => {
    if (activeNoteId !== null && activeProjectId !== null) expand(activeProjectId)
  }, [activeNoteId, activeProjectId, expand])

  // foco adiado: a linha pedida pode só existir depois deste render
  useEffect(() => {
    const key = pendingFocus.current
    if (!key) return
    const element = itemRefs.current.get(key)
    if (!element) return
    pendingFocus.current = null
    setFocusKey(key)
    element.focus()
  }, [rows, query])

  const registerRow = useCallback(
    (key: string) => (element: HTMLElement | null) => {
      if (element) itemRefs.current.set(key, element)
      else itemRefs.current.delete(key)
    },
    []
  )

  const focusRow = useCallback((key: string | null) => {
    if (!key) return
    const element = itemRefs.current.get(key)
    if (element) {
      setFocusKey(key)
      element.focus()
    } else {
      pendingFocus.current = key
    }
  }, [])

  /* ---------------------------------------------------------------------- */
  /* Arrastar para reordenar                                                  */
  /* ---------------------------------------------------------------------- */

  const resolveTarget: ResolveTarget = (element, item, clientY) => {
    if (!element) return NO_TARGET
    // sobre a área de trabalho: soltar abre a nota/projeto num painel ao lado
    if (element.closest('main')) return OPEN_TARGET
    if (item.kind === 'project') {
      const block = element.closest<HTMLElement>('[data-project-block]')
      if (!block) return NO_TARGET
      const id = Number(block.dataset.projectBlock)
      if (id === item.id) return NO_TARGET
      const place = dropPlaceFromPointer(block.getBoundingClientRect(), clientY)
      const ids = tree.map((project) => project.id)
      if (sameOrder(ids, moveItem(ids, item.id, id, place))) return NO_TARGET
      return { target: { id, place }, invalid: false, open: false }
    }

    const project = tree.find((entry) => entry.id === item.projectId)
    if (!project) return NO_TARGET
    const ids = project.notes.map((note) => note.id)
    // só mostra a linha quando soltar ali muda a ordem de fato
    const accept = (id: number, place: DropPlace): Resolution =>
      sameOrder(ids, moveItem(ids, item.id, id, place))
        ? NO_TARGET
        : { target: { id, place }, invalid: false, open: false }

    const note = element.closest<HTMLElement>('[data-note-id]')
    if (note) {
      if (Number(note.dataset.projectId) !== item.projectId) return INVALID_TARGET
      const place = dropPlaceFromPointer(note.getBoundingClientRect(), clientY)
      return accept(Number(note.dataset.noteId), place)
    }
    const block = element.closest<HTMLElement>('[data-project-block]')
    if (!block) return NO_TARGET
    if (Number(block.dataset.projectBlock) !== item.projectId) return INVALID_TARGET
    // sobre a linha do próprio projeto: entra antes da primeira nota visível
    const first = element.closest<HTMLElement>('[data-project-row]')?.dataset.firstNote
    return first ? accept(Number(first), 'before') : NO_TARGET
  }

  const handleDrop = (item: DragItem, target: DropTarget): void => {
    if (item.kind === 'project') {
      const ids = tree.map((project) => project.id)
      const next = moveItem(ids, item.id, target.id, target.place)
      if (!sameOrder(ids, next)) onReorderProjects(next)
      return
    }
    const project = tree.find((entry) => entry.id === item.projectId)
    if (!project) return
    const ids = project.notes.map((note) => note.id)
    const next = moveItem(ids, item.id, target.id, target.place)
    if (!sameOrder(ids, next)) onReorderNotes(project.id, next)
  }

  const handleOpen = (item: DragItem): void => {
    onOpenInSplit(
      item.kind === 'note'
        ? { kind: 'note', projectId: item.projectId, noteId: item.id }
        : { kind: 'project', projectId: item.id }
    )
  }

  const { drag, startPress, consumeDragClick } = useReorderDrag({
    scrollRef: navRef,
    resolve: resolveTarget,
    onDrop: handleDrop,
    onOpen: handleOpen
  })

  /* ---------------------------------------------------------------------- */
  /* Teclado                                                                  */
  /* ---------------------------------------------------------------------- */

  /** Alt+↑/↓: move a nota uma casa entre as visíveis, mantendo as arquivadas na ordem completa. */
  const moveNote = (projectId: number, noteId: number, direction: -1 | 1): void => {
    const project = tree.find((entry) => entry.id === projectId)
    if (!project) return
    const ids = project.notes.map((note) => note.id)
    const visible = visibleNotes(project.notes, archivedOpen.has(projectId), openNoteIds).map(
      (note) => note.id
    )
    const next = moveAdjacent(ids, noteId, direction, visible)
    if (!sameOrder(ids, next)) onReorderNotes(projectId, next)
    setFocusKey(noteKey(noteId))
  }

  const clearSearch = (): void => {
    setQuery('')
    focusRow(currentKey)
  }

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      clearSearch()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const first = navRef.current?.querySelector<HTMLElement>('.hit')
      if (first) first.focus()
      else focusRow(currentKey)
    }
  }

  const onHitsKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      clearSearch()
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const buttons = Array.from(navRef.current?.querySelectorAll<HTMLElement>('.hit') ?? [])
    const at = buttons.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowUp' && at <= 0) {
      searchRef.current?.focus()
      return
    }
    buttons[at + (event.key === 'ArrowDown' ? 1 : -1)]?.focus()
  }

  const onTreeKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (searching) {
      onHitsKeyDown(event)
      return
    }
    const index = rows.findIndex((row) => row.key === currentKey)
    const row = rows[index]
    if (!row) return

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        const direction: -1 | 1 = event.key === 'ArrowDown' ? 1 : -1
        if (event.altKey) {
          if (row.kind === 'note') moveNote(row.projectId, row.id, direction)
          else if (active.kind === 'note') moveNote(active.projectId, active.noteId, direction)
          return
        }
        const next = rows[Math.min(rows.length - 1, Math.max(0, index + direction))]
        if (next) focusRow(next.key)
        return
      }
      case 'Home':
        event.preventDefault()
        focusRow(rows[0].key)
        return
      case 'End':
        event.preventDefault()
        focusRow(rows[rows.length - 1].key)
        return
      case 'ArrowLeft':
        event.preventDefault()
        if (row.kind === 'project') collapse(row.id)
        else focusRow(projectKey(row.projectId))
        return
      case 'ArrowRight': {
        event.preventDefault()
        if (row.kind !== 'project') return
        if (collapsed.has(row.id)) {
          expand(row.id)
          return
        }
        const child = rows[index + 1]
        if (child && child.kind !== 'project' && child.projectId === row.id) focusRow(child.key)
        return
      }
      default:
        return
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Busca                                                                    */
  /* ---------------------------------------------------------------------- */

  const hitLabel = (kind: MemoryHit['kind']): string => {
    if (kind === 'note') return t.note
    if (kind === 'task') return t.taskLabel
    if (kind === 'attachment') return t.attachmentLabel
    return t.project
  }

  const openHit = (hit: MemoryHit): void => {
    const selection: Selection =
      hit.kind === 'note'
        ? { kind: 'note', projectId: hit.projectId, noteId: hit.refId }
        : { kind: 'project', projectId: hit.projectId }
    expand(hit.projectId)
    onSelect(selection)
    setQuery('')
    focusRow(selection.kind === 'note' ? noteKey(selection.noteId) : projectKey(hit.projectId))
  }

  /* ---------------------------------------------------------------------- */
  /* Árvore                                                                   */
  /* ---------------------------------------------------------------------- */

  const renderNote = (
    item: ProjectTree,
    entry: ProjectTree['notes'][number]
  ): React.JSX.Element => {
    const selection: Selection = { kind: 'note', projectId: item.id, noteId: entry.id }
    const shownIn = paneIndexShowing(workspace, selection)
    const isOn = shownIn === workspace.active
    const isOpen = shownIn >= 0 && !isOn
    const key = noteKey(entry.id)
    const title = displayNoteTitle(entry.title, t)
    const dropPlace =
      drag?.kind === 'note' && drag.target?.id === entry.id ? drag.target.place : null
    return (
      <button
        key={entry.id}
        ref={registerRow(key)}
        type="button"
        role="treeitem"
        aria-level={2}
        aria-selected={isOn}
        tabIndex={key === currentKey ? 0 : -1}
        title={title}
        data-note-id={entry.id}
        data-project-id={item.id}
        className={cx(
          'note',
          entry.completed && 'is-done',
          isUntitledNote(entry.title) && 'is-untitled',
          isOn && 'is-on',
          isOpen && 'is-open',
          drag?.kind === 'note' && drag.id === entry.id && 'is-dragging',
          dropPlace && `is-drop-${dropPlace}`
        )}
        onFocus={() => setFocusKey(key)}
        onPointerDown={(event) =>
          startPress(event, { kind: 'note', id: entry.id, projectId: item.id })
        }
        onClick={(event) => {
          if (consumeDragClick()) return
          if (event.altKey || event.ctrlKey || event.metaKey) onOpenInSplit(selection)
          else onSelect(selection)
        }}
        onAuxClick={(event) => {
          if (event.button === 1) onOpenInSplit(selection)
        }}
      >
        <span className="label">{title}</span>
      </button>
    )
  }

  const renderProject = (item: ProjectTree): React.JSX.Element => {
    const isCollapsed = collapsed.has(item.id)
    const projectSelected = active.kind === 'project' && active.projectId === item.id
    const projectActive = activeProjectId === item.id
    const showArch = archivedOpen.has(item.id)
    const notes = visibleNotes(item.notes, showArch, openNoteIds)
    const activeCount = countActive(item.notes)
    const archivedCount = item.notes.length - activeCount
    const key = projectKey(item.id)
    const toggleKey = archivedKey(item.id)
    const dropPlace =
      drag?.kind === 'project' && drag.target?.id === item.id ? drag.target.place : null
    return (
      <div
        key={item.id}
        role="group"
        data-project-block={item.id}
        className={cx(
          'project-block',
          isCollapsed && 'is-collapsed',
          projectActive && 'is-active',
          drag?.kind === 'project' && drag.id === item.id && 'is-dragging',
          dropPlace && `is-drop-${dropPlace}`
        )}
      >
        <div className="project-row" data-project-row data-first-note={notes[0]?.id ?? ''}>
          <button
            type="button"
            className="chevron"
            tabIndex={-1}
            title={isCollapsed ? t.expandProject : t.collapseProject}
            aria-label={isCollapsed ? t.expandProject : t.collapseProject}
            onClick={() => toggle(item.id)}
          >
            <IconChevronSmall />
          </button>
          <button
            ref={registerRow(key)}
            type="button"
            role="treeitem"
            aria-level={1}
            aria-expanded={!isCollapsed}
            aria-selected={projectSelected}
            tabIndex={key === currentKey ? 0 : -1}
            title={item.name}
            className={cx('project', projectSelected && 'is-on')}
            onFocus={() => setFocusKey(key)}
            onPointerDown={(event) =>
              startPress(event, { kind: 'project', id: item.id, projectId: item.id })
            }
            onClick={() => {
              if (consumeDragClick()) return
              onSelect({ kind: 'project', projectId: item.id })
            }}
          >
            <span className="label">{item.name}</span>
          </button>
          {isCollapsed && activeCount > 0 && (
            <span className="note-count" title={t.notesCount(activeCount)}>
              {activeCount}
            </span>
          )}
          <button
            type="button"
            className="add-note-icon"
            tabIndex={-1}
            title={t.newNote}
            aria-label={t.newNote}
            onClick={(event) => {
              event.stopPropagation()
              expand(item.id)
              onCreateNote(item.id)
            }}
          >
            <IconPlusSmall />
          </button>
        </div>
        {!isCollapsed && notes.map((entry) => renderNote(item, entry))}
        {showsArchivedToggle(item, { collapsed, archivedOpen, openNoteIds, activeProjectId }) && (
          <button
            ref={registerRow(toggleKey)}
            type="button"
            className="archived-toggle"
            tabIndex={toggleKey === currentKey ? 0 : -1}
            onFocus={() => setFocusKey(toggleKey)}
            onClick={() =>
              setArchivedOpen((current) => {
                const next = new Set(current)
                if (next.has(item.id)) next.delete(item.id)
                else next.add(item.id)
                return next
              })
            }
          >
            {showArch ? t.hideArchived : t.showArchived(archivedCount)}
          </button>
        )}
      </div>
    )
  }

  return (
    <aside
      className={cx(
        'sidebar',
        drag && 'is-dragging',
        drag?.invalid && 'is-drop-invalid',
        resizing && 'is-resizing'
      )}
    >
      <div className="sidebar-head">
        <strong>{t.appName}</strong>
      </div>
      <input
        ref={searchRef}
        className="search"
        type="search"
        value={query}
        placeholder={t.search}
        aria-label={t.search}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onSearchKeyDown}
      />
      <nav
        ref={navRef}
        role={searching ? 'listbox' : 'tree'}
        aria-label={searching ? t.search : t.appName}
        onKeyDown={onTreeKeyDown}
      >
        {searching ? (
          <div className="hits">
            {hits.map((hit) => (
              <button
                key={`${hit.kind}-${hit.refId}`}
                type="button"
                role="option"
                aria-selected={false}
                className="hit"
                title={hit.title || hit.body}
                onClick={() => openHit(hit)}
              >
                <small>{hitLabel(hit.kind)}</small>
                <span>{hit.kind === 'task' ? hit.body : hit.title || hit.body}</span>
              </button>
            ))}
            {!pending && hits.length === 0 && <p className="no-results">{t.noResults}</p>}
          </div>
        ) : (
          tree.map(renderProject)
        )}
      </nav>
      <div className="sidebar-foot-row">
        <button type="button" className="sidebar-foot" onClick={onCreateProject}>
          <IconPlusSmall />
          {t.project}
        </button>
        <button type="button" className="sidebar-gear" title={t.settings} onClick={onOpenSettings}>
          <IconSettingsSmall />
        </button>
      </div>
      <div
        className={cx('sidebar-resizer', resizing && 'is-active')}
        role="separator"
        aria-orientation="vertical"
        aria-label={t.resizeSidebar}
        title={t.resizeSidebar}
        {...handleProps}
      />
    </aside>
  )
}
