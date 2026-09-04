import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ProjectTree } from '../../shared/types'
import { readStorage, useLatest, writeStorage } from './components/hooks'
import { NameDialog } from './components/NameDialog'
import { SettingsDialog } from './components/SettingsDialog'
import { Sidebar } from './components/Sidebar'
import { WorkspaceView, type DropTarget, type PaneActions } from './components/Workspace'
import { useSettings } from './settings-context'
import {
  closeOther,
  closePane,
  dropDeleted,
  initialWorkspace,
  MAX_PANES,
  moveAside,
  openInPane,
  openInSplit,
  parseWorkspace,
  projectIdForNewNote,
  pruneAgainstTree,
  selectInActive,
  serializeWorkspace,
  setActive,
  splitActive,
  swapPanes,
  WORKSPACE_KEY,
  type Selection,
  type Workspace
} from './workspace'

type Dialog =
  | { kind: 'none' }
  | { kind: 'project' }
  | { kind: 'delete-project'; id: number; name: string }
  | { kind: 'delete-note'; id: number; projectId: number }
  | { kind: 'settings' }

function isBackslash(event: KeyboardEvent): boolean {
  // ABNT2 e outros layouts mudam o `code`; a tecla em si é o que importa
  return event.key === '\\' || event.key === '|' || event.code === 'Backslash'
}

export default function App(): React.JSX.Element {
  const [tree, setTree] = useState<ProjectTree[]>([])
  const [workspace, setWorkspace] = useState<Workspace>(
    () => parseWorkspace(readStorage(WORKSPACE_KEY)) ?? initialWorkspace
  )
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' })
  // null até sabermos; true no harness de screenshot (não persistir nada)
  const [harness, setHarness] = useState<boolean | null>(null)
  const { t } = useSettings()

  const reloadTree = useCallback(async () => {
    const next = await window.api.projects.tree()
    setTree(next)
    setWorkspace((current) => pruneAgainstTree(current, next))
  }, [])

  useEffect(() => {
    void reloadTree()
  }, [reloadTree])

  useEffect(() => {
    if (harness === false) writeStorage(WORKSPACE_KEY, serializeWorkspace(workspace))
  }, [workspace, harness])

  // harness de screenshot: abre a cena pedida assim que a árvore chegar
  useEffect(() => {
    let cancelled = false
    void window.api.app.info().then(async (info) => {
      if (cancelled) return
      setHarness(Boolean(info.scene))
      if (!info.scene) return
      const loaded = await window.api.projects.tree()
      if (cancelled) return
      const first = loaded[0]
      const notes = first?.notes.filter((note) => !note.completed) ?? []
      const firstNote = notes[0]
      const secondNote = notes[1]
      const noteSel = (noteId: number): Selection =>
        first ? { kind: 'note', projectId: first.id, noteId } : { kind: 'none' }
      if (info.scene === 'note' && first && firstNote) {
        setWorkspace(selectInActive(initialWorkspace, noteSel(firstNote.id)))
      } else if (info.scene === 'project' && first) {
        setWorkspace(selectInActive(initialWorkspace, { kind: 'project', projectId: first.id }))
      } else if (info.scene === 'split' && first && firstNote) {
        let next = selectInActive(initialWorkspace, noteSel(firstNote.id))
        next = openInSplit(
          next,
          secondNote ? noteSel(secondNote.id) : { kind: 'project', projectId: first.id }
        )
        setWorkspace(next)
      } else if (info.scene === 'split-project' && first && firstNote) {
        // nota à esquerda, projeto dela à direita (o que "Dividir" faz)
        setWorkspace(splitActive(selectInActive(initialWorkspace, noteSel(firstNote.id))))
      } else if (info.scene === 'delete-dialog' && first && firstNote) {
        setWorkspace(selectInActive(initialWorkspace, noteSel(firstNote.id)))
        setDialog({ kind: 'delete-note', id: firstNote.id, projectId: first.id })
      } else if (info.scene === 'settings') {
        setDialog({ kind: 'settings' })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const select = useCallback((selection: Selection) => {
    setWorkspace((current) => selectInActive(current, selection))
  }, [])

  const createProject = async (name: string): Promise<void> => {
    const created = await window.api.projects.create(name)
    await reloadTree()
    select({ kind: 'project', projectId: created.id })
    setDialog({ kind: 'none' })
  }

  const createNote = useCallback(
    async (projectId: number): Promise<void> => {
      const created = await window.api.notes.create(projectId, '')
      await reloadTree()
      select({ kind: 'note', projectId, noteId: created.id })
    },
    [reloadTree, select]
  )

  // atalhos globais; ignorados enquanto um diálogo está aberto
  const latest = useLatest({ dialogOpen: dialog.kind !== 'none', workspace, tree })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const { dialogOpen, workspace, tree } = latest.current
      if (dialogOpen || event.altKey || !(event.ctrlKey || event.metaKey)) return
      if (isBackslash(event)) {
        event.preventDefault()
        if (event.shiftKey) setWorkspace(swapPanes)
        else setWorkspace((ws) => (ws.panes.length > 1 ? closeOther(ws) : splitActive(ws)))
        return
      }
      if (event.shiftKey) return
      if (event.code === 'Digit1' || event.code === 'Digit2') {
        event.preventDefault()
        setWorkspace((ws) => setActive(ws, event.code === 'Digit1' ? 0 : 1))
        return
      }
      if (event.code === 'KeyN') {
        event.preventDefault()
        const projectId = projectIdForNewNote(workspace, tree)
        if (projectId !== null) void createNote(projectId)
        else setDialog({ kind: 'project' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [latest, createNote])

  const reorderProjects = useCallback(
    async (ids: number[]): Promise<void> => {
      setTree((current) => {
        const byId = new Map(current.map((item) => [item.id, item]))
        return ids.map((id) => byId.get(id)).filter((item): item is ProjectTree => Boolean(item))
      })
      await window.api.projects.reorder(ids)
      await reloadTree()
    },
    [reloadTree]
  )

  const reorderNotes = useCallback(
    async (projectId: number, ids: number[]): Promise<void> => {
      setTree((current) =>
        current.map((item) => {
          if (item.id !== projectId) return item
          const byId = new Map(item.notes.map((note) => [note.id, note]))
          const ordered = ids.map((id) => byId.get(id)).filter((note) => note !== undefined)
          const rest = item.notes.filter((note) => !ids.includes(note.id))
          return { ...item, notes: [...ordered, ...rest] }
        })
      )
      await window.api.notes.reorder(projectId, ids)
      await reloadTree()
    },
    [reloadTree]
  )

  const paneActions = useMemo(
    () =>
      (index: number): PaneActions => ({
        onActivate: () => setWorkspace((current) => setActive(current, index)),
        onClose: () => setWorkspace((current) => closePane(current, index)),
        onSplit: () => setWorkspace((current) => splitActive(setActive(current, index))),
        onSwap: () => setWorkspace(swapPanes),
        onMoveAside: () => setWorkspace((current) => moveAside(current, index)),
        canSplit: workspace.panes.length < MAX_PANES,
        canClose: workspace.panes.length > 1,
        canSwap: workspace.panes.length > 1,
        onSelect: (selection) =>
          setWorkspace((current) => selectInActive(setActive(current, index), selection)),
        onOpenInSplit: (selection) =>
          setWorkspace((current) => openInSplit(setActive(current, index), selection)),
        onCreateNote: (projectId) => {
          setWorkspace((current) => setActive(current, index))
          void createNote(projectId)
        },
        onRequestDeleteProject: (project) =>
          setDialog({ kind: 'delete-project', id: project.id, name: project.name }),
        onRequestDeleteNote: (note) =>
          setDialog({ kind: 'delete-note', id: note.id, projectId: note.projectId }),
        onTreeChanged: () => void reloadTree(),
        projectOf: (projectId) => tree.find((item) => item.id === projectId)
      }),
    [workspace.panes.length, createNote, reloadTree, tree]
  )

  const dropSelection = useCallback((target: DropTarget, selection: Selection) => {
    setWorkspace((current) =>
      target === 'split' ? openInSplit(current, selection) : openInPane(current, target, selection)
    )
  }, [])

  return (
    <div className="app">
      <Sidebar
        tree={tree}
        workspace={workspace}
        onSelect={select}
        onOpenInSplit={(selection) => setWorkspace((current) => openInSplit(current, selection))}
        onCreateProject={() => setDialog({ kind: 'project' })}
        onCreateNote={(projectId) => void createNote(projectId)}
        onOpenSettings={() => setDialog({ kind: 'settings' })}
        onReorderProjects={(ids) => void reorderProjects(ids)}
        onReorderNotes={(projectId, ids) => void reorderNotes(projectId, ids)}
      />

      <WorkspaceView
        workspace={workspace}
        paneActions={paneActions}
        onDropSelection={dropSelection}
        persist={harness === false}
      />

      {dialog.kind === 'project' && (
        <NameDialog
          title={t.newProject}
          confirmLabel={t.create}
          cancelLabel={t.cancel}
          placeholder={t.projectName}
          onCancel={() => setDialog({ kind: 'none' })}
          onConfirm={(name) => void createProject(name)}
        />
      )}
      {dialog.kind === 'settings' && <SettingsDialog onClose={() => setDialog({ kind: 'none' })} />}
      {dialog.kind === 'delete-project' && (
        <NameDialog
          title={t.deleteProject}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          danger
          placeholder={t.deleteProjectAsk(dialog.name)}
          onCancel={() => setDialog({ kind: 'none' })}
          onConfirm={async () => {
            await window.api.projects.delete(dialog.id)
            setWorkspace((current) => dropDeleted(current, { projectId: dialog.id }))
            setDialog({ kind: 'none' })
            await reloadTree()
          }}
        />
      )}
      {dialog.kind === 'delete-note' && (
        <NameDialog
          title={t.deleteNote}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          danger
          placeholder={t.deleteNoteAsk}
          onCancel={() => setDialog({ kind: 'none' })}
          onConfirm={async () => {
            await window.api.notes.delete(dialog.id)
            setWorkspace((current) => dropDeleted(current, { noteId: dialog.id }))
            setDialog({ kind: 'none' })
            await reloadTree()
          }}
        />
      )}
    </div>
  )
}
