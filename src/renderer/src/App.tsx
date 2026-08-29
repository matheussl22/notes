import { useCallback, useEffect, useState } from 'react'
import type { MemoryHit, Note, Project, ProjectTree } from '../../shared/types'
import { Attachments } from './components/Attachments'
import { IconMore, IconPlus, IconSettings } from './components/Icons'
import { NameDialog } from './components/NameDialog'
import { NoteEditor } from './components/NoteEditor'
import { SettingsDialog } from './components/SettingsDialog'
import { displayNoteTitle, isUntitledNote } from './i18n'
import { useSettings } from './settings'

type Selection =
  | { kind: 'none' }
  | { kind: 'project'; projectId: number }
  | { kind: 'note'; projectId: number; noteId: number }

function closeMenu(event: React.MouseEvent<HTMLElement>): void {
  event.currentTarget.closest('details')?.removeAttribute('open')
}

export default function App(): React.JSX.Element {
  const [tree, setTree] = useState<ProjectTree[]>([])
  const [selection, setSelection] = useState<Selection>({ kind: 'none' })
  const [project, setProject] = useState<Project | null>(null)
  const [note, setNote] = useState<Note | null>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<MemoryHit[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dropId, setDropId] = useState<number | null>(null)
  const [dialog, setDialog] = useState<
    | { kind: 'none' }
    | { kind: 'project' }
    | { kind: 'delete-project'; id: number; name: string }
    | { kind: 'delete-note'; id: number; projectId: number }
    | { kind: 'settings' }
  >({ kind: 'none' })

  const { t, locale } = useSettings()

  const reloadTree = useCallback(async () => {
    setTree(await window.api.projects.tree())
  }, [])

  useEffect(() => {
    void reloadTree()
  }, [reloadTree])

  useEffect(() => {
    if (selection.kind === 'none') {
      setProject(null)
      setNote(null)
      return
    }
    void window.api.projects.get(selection.projectId).then(setProject)
    if (selection.kind === 'note') {
      void window.api.notes.get(selection.noteId).then(setNote)
    } else {
      setNote(null)
    }
  }, [selection])

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (!query.trim()) {
        setHits([])
        return
      }
      setHits(await window.api.memory.search(query))
    }, 180)
    return () => window.clearTimeout(handle)
  }, [query])

  const createProject = async (name: string): Promise<void> => {
    const created = await window.api.projects.create(name)
    await reloadTree()
    setSelection({ kind: 'project', projectId: created.id })
    setDialog({ kind: 'none' })
  }

  const moveProject = async (fromId: number, toId: number): Promise<void> => {
    if (fromId === toId) return
    const from = tree.findIndex((item) => item.id === fromId)
    const to = tree.findIndex((item) => item.id === toId)
    if (from < 0 || to < 0) return
    const next = [...tree]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setTree(next)
    await window.api.projects.reorder(next.map((item) => item.id))
  }

  const createNote = async (projectId: number, title: string): Promise<void> => {
    const created = await window.api.notes.create(projectId, title)
    await reloadTree()
    setSelection({ kind: 'note', projectId, noteId: created.id })
    setDialog({ kind: 'none' })
  }

  return (
    <div className="app">
      <aside>
        <div className="sidebar-head">
          <strong>{t.appName}</strong>
        </div>
        <input
          className="search"
          value={query}
          placeholder={t.search}
          onChange={(event) => setQuery(event.target.value)}
        />
        {hits.length > 0 && (
          <div className="hits">
            {hits.map((hit) => (
              <button
                key={`${hit.kind}-${hit.refId}`}
                type="button"
                onClick={() => {
                  if (hit.kind === 'note') {
                    setSelection({ kind: 'note', projectId: hit.projectId, noteId: hit.refId })
                  } else {
                    setSelection({ kind: 'project', projectId: hit.projectId })
                  }
                  setQuery('')
                  setHits([])
                }}
              >
                <small>{hit.kind === 'note' ? t.note : t.project}</small>
                <span>{hit.title || hit.body}</span>
              </button>
            ))}
          </div>
        )}
        <nav>
          {tree.map((item) => {
            const notes = item.notes.filter((entry) => showArchived || !entry.completed)
            const archived = item.notes.filter((entry) => entry.completed).length
            const projectActive = selection.kind !== 'none' && selection.projectId === item.id
            return (
              <div
                key={item.id}
                className={`project-block ${draggingId === item.id ? 'is-dragging' : ''} ${dropId === item.id && draggingId !== item.id ? 'is-drop' : ''} ${projectActive ? 'is-active' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDropId(item.id)
                }}
                onDragLeave={() => {
                  setDropId((current) => (current === item.id ? null : current))
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const fromId = Number(event.dataTransfer.getData('text/project-id'))
                  setDraggingId(null)
                  setDropId(null)
                  if (Number.isFinite(fromId)) void moveProject(fromId, item.id)
                }}
              >
                <div className="project-row">
                  <button
                    type="button"
                    draggable
                    className={`project ${selection.kind === 'project' && selection.projectId === item.id ? 'is-on' : ''}`}
                    onClick={() => setSelection({ kind: 'project', projectId: item.id })}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/project-id', String(item.id))
                      event.dataTransfer.effectAllowed = 'move'
                      setDraggingId(item.id)
                    }}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setDropId(null)
                    }}
                  >
                    {item.name}
                  </button>
                  <button
                    type="button"
                    className="add-note-icon"
                    title={t.newNote}
                    onClick={(event) => {
                      event.stopPropagation()
                      void createNote(item.id, '')
                    }}
                  >
                    <IconPlus />
                  </button>
                </div>
                {notes.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`note ${entry.completed ? 'is-done' : ''} ${isUntitledNote(entry.title) ? 'is-untitled' : ''} ${selection.kind === 'note' && selection.noteId === entry.id ? 'is-on' : ''}`}
                    onClick={() =>
                      setSelection({ kind: 'note', projectId: item.id, noteId: entry.id })
                    }
                  >
                    {displayNoteTitle(entry.title, t)}
                  </button>
                ))}
                {archived > 0 && projectActive && (
                  <button
                    type="button"
                    className="ghost small"
                    onClick={() => setShowArchived((value) => !value)}
                  >
                    {showArchived ? t.hideArchived : t.showArchived(archived)}
                  </button>
                )}
              </div>
            )
          })}
        </nav>
        <div className="sidebar-foot-row">
          <button type="button" className="sidebar-foot" onClick={() => setDialog({ kind: 'project' })}>
            <IconPlus />
            {t.project}
          </button>
          <button
            type="button"
            className="sidebar-gear"
            title={t.settings}
            onClick={() => setDialog({ kind: 'settings' })}
          >
            <IconSettings />
          </button>
        </div>
      </aside>

      <main>
        {selection.kind === 'none' && (
          <div className="empty-main">
            <p className="empty-title">{t.emptyTitle}</p>
            <p className="empty-hint">{t.emptyHint}</p>
          </div>
        )}

        {selection.kind === 'project' && project && (
          <div className="pane">
            <div className="pane-head">
              <input
                className="title"
                value={project.name}
                onChange={(event) => setProject({ ...project, name: event.target.value })}
                onBlur={() => void window.api.projects.update(project.id, { name: project.name }).then(reloadTree)}
              />
              <details className="more">
                <summary title={t.more}>
                  <IconMore />
                </summary>
                <div className="more-menu">
                  <button
                    type="button"
                    className="danger-item"
                    onClick={(event) => {
                      closeMenu(event)
                      setDialog({ kind: 'delete-project', id: project.id, name: project.name })
                    }}
                  >
                    {t.delete}
                  </button>
                </div>
              </details>
            </div>
            <textarea
              className="description"
              value={project.description}
              placeholder={t.projectDescription}
              onChange={(event) => setProject({ ...project, description: event.target.value })}
              onBlur={() =>
                void window.api.projects.update(project.id, { description: project.description })
              }
            />
            <div className="row">
              <button
                type="button"
                className="text-action"
                onClick={() => void createNote(project.id, '')}
              >
                {t.newNote}
              </button>
            </div>
            <Attachments projectId={project.id} noteId={null} />
          </div>
        )}

        {selection.kind === 'note' && note && (
          <div className="pane">
            <div className="note-head">
              <input
                className="title"
                value={note.title}
                onChange={(event) => setNote({ ...note, title: event.target.value })}
                onBlur={() => void window.api.notes.update(note.id, { title: note.title }).then(reloadTree)}
              />
              <details className="more">
                <summary title={t.more}>
                  <IconMore />
                </summary>
                <div className="more-menu">
                  <button
                    type="button"
                    onClick={async (event) => {
                      closeMenu(event)
                      const updated = await window.api.notes.update(note.id, {
                        completed: !note.completed
                      })
                      setNote(updated)
                      await reloadTree()
                    }}
                  >
                    {note.completed ? t.unarchive : t.archive}
                  </button>
                  <button
                    type="button"
                    className="danger-item"
                    onClick={(event) => {
                      closeMenu(event)
                      setDialog({ kind: 'delete-note', id: note.id, projectId: note.projectId })
                    }}
                  >
                    {t.delete}
                  </button>
                </div>
              </details>
            </div>
            <NoteEditor
              key={`${note.id}-${locale}`}
              noteId={note.id}
              initialJson={note.bodyJson}
              placeholder={t.editorPlaceholder}
              labels={{
                bold: t.bold,
                italic: t.italic,
                heading: t.heading,
                list: t.list,
                checkbox: t.checkbox
              }}
              onChange={(bodyJson) => {
                void window.api.notes.update(note.id, { bodyJson })
              }}
            />
            <Attachments projectId={note.projectId} noteId={note.id} />
          </div>
        )}
      </main>

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
            setSelection({ kind: 'none' })
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
            setSelection({ kind: 'project', projectId: dialog.projectId })
            setDialog({ kind: 'none' })
            await reloadTree()
          }}
        />
      )}
    </div>
  )
}
