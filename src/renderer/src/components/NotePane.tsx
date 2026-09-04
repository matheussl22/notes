import { useCallback, useEffect, useRef, useState } from 'react'
import type { Note } from '../../../shared/types'
import { untitledProjects } from '../i18n'
import { useSettings } from '../settings-context'
import { Attachments } from './Attachments'
import { useLatest, useUnmountFlush } from './hooks'
import { MoreMenu } from './MoreMenu'
import { NoteEditor } from './NoteEditor'
import { PaneToolbar } from './PaneToolbar'
import type { PaneActions } from './Workspace'

type Props = {
  noteId: number
  actions: PaneActions
}

export function NotePane({ noteId, actions }: Props): React.JSX.Element | null {
  const { t, locale } = useSettings()
  const [note, setNote] = useState<Note | null>(null)
  // título como está gravado; só salvamos (e recarregamos a árvore) se mudou
  const savedTitle = useRef('')
  const titleRef = useRef<HTMLInputElement>(null)
  const latest = useLatest(actions)

  // título alterado fora deste painel (ex.: renomeado na sidebar): refletir,
  // a menos que o usuário esteja editando aqui
  const treeTitle = actions
    .projectOf(note?.projectId ?? -1)
    ?.notes.find((item) => item.id === noteId)?.title
  useEffect(() => {
    if (treeTitle === undefined || treeTitle === savedTitle.current) return
    if (document.activeElement === titleRef.current) return
    savedTitle.current = treeTitle
    setNote((current) => (current ? { ...current, title: treeTitle } : current))
  }, [treeTitle])

  useEffect(() => {
    let alive = true
    void window.api.notes.get(noteId).then((loaded) => {
      if (!alive) return
      if (!loaded) {
        // apagada em outro painel: a árvore recarregada limpa esta seleção
        latest.current.onTreeChanged()
        return
      }
      savedTitle.current = loaded.title
      setNote(loaded)
    })
    return () => {
      alive = false
    }
  }, [noteId, latest])

  // mantém `note.bodyJson` em dia com o editor: se o editor for remontado
  // (troca de idioma), ele volta a partir do texto mais recente, não do carregado
  const saveBody = useCallback(
    (bodyJson: string) => {
      setNote((current) => (current && current.id === noteId ? { ...current, bodyJson } : current))
      void window.api.notes.update(noteId, { bodyJson })
    },
    [noteId]
  )

  const commitTitle = useCallback(() => {
    if (!note || note.title === savedTitle.current) return
    savedTitle.current = note.title
    void window.api.notes.update(note.id, { title: note.title }).then(() => {
      latest.current.onTreeChanged()
    })
  }, [note, latest])

  // fechar o painel com o título editado e sem blur não pode perder a alteração
  useUnmountFlush(commitTitle)

  if (!note) return null

  const project = actions.projectOf(note.projectId)
  const projectName =
    project && !untitledProjects.has(project.name.trim()) ? project.name : t.untitledProject

  return (
    <div className="pane">
      <header className="pane-top">
        <button
          type="button"
          className="crumb"
          title={t.openProject}
          onClick={() => actions.onSelect({ kind: 'project', projectId: note.projectId })}
        >
          {projectName}
        </button>
        <div className="pane-head">
          <input
            ref={titleRef}
            className="title"
            value={note.title}
            placeholder={t.untitled}
            spellCheck={false}
            onChange={(event) => setNote({ ...note, title: event.target.value })}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
          <MoreMenu label={t.more}>
            <button type="button" onClick={actions.onMoveAside}>
              {t.openInSplit}
            </button>
            <button
              type="button"
              onClick={async () => {
                const updated = await window.api.notes.update(note.id, {
                  completed: !note.completed
                })
                if (updated) setNote(updated)
                actions.onTreeChanged()
              }}
            >
              {note.completed ? t.unarchive : t.archive}
            </button>
            <hr className="menu-sep" />
            <button
              type="button"
              className="danger-item"
              onClick={() =>
                actions.onRequestDeleteNote({ id: note.id, projectId: note.projectId })
              }
            >
              {t.delete}
            </button>
          </MoreMenu>
          <PaneToolbar actions={actions} />
        </div>
      </header>
      <div className="pane-body">
        <NoteEditor
          key={`${note.id}-${locale}`}
          noteId={note.id}
          projectId={note.projectId}
          initialJson={note.bodyJson}
          onChange={saveBody}
        />
      </div>
      <Attachments projectId={note.projectId} noteId={note.id} />
    </div>
  )
}
