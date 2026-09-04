import { useCallback, useEffect, useRef, useState } from 'react'
import type { Project } from '../../../shared/types'
import { useSettings } from '../settings-context'
import { Attachments } from './Attachments'
import { useLatest, useUnmountFlush } from './hooks'
import { MoreMenu } from './MoreMenu'
import { NoteList } from './NoteList'
import { PaneToolbar } from './PaneToolbar'
import type { PaneActions } from './Workspace'

type Props = {
  projectId: number
  actions: PaneActions
}

export function ProjectPane({ projectId, actions }: Props): React.JSX.Element | null {
  const { t } = useSettings()
  const [project, setProject] = useState<Project | null>(null)
  // valores como estão gravados; blur sem mudança não grava nem recarrega
  const saved = useRef({ name: '', description: '' })
  const titleRef = useRef<HTMLInputElement>(null)
  const latest = useLatest(actions)

  // o mesmo projeto pode estar aberto nos dois painéis: se o nome mudou lá
  // (ou na sidebar), refletimos aqui — a menos que o usuário esteja editando
  const treeName = actions.projectOf(projectId)?.name
  useEffect(() => {
    if (treeName === undefined || treeName === saved.current.name) return
    if (document.activeElement === titleRef.current) return
    saved.current.name = treeName
    setProject((current) => (current ? { ...current, name: treeName } : current))
  }, [treeName])

  useEffect(() => {
    let alive = true
    void window.api.projects.get(projectId).then((loaded) => {
      if (!alive) return
      if (!loaded) {
        latest.current.onTreeChanged()
        return
      }
      saved.current = { name: loaded.name, description: loaded.description }
      setProject(loaded)
    })
    return () => {
      alive = false
    }
  }, [projectId, latest])

  const commitName = useCallback(() => {
    if (!project || project.name === saved.current.name) return
    void window.api.projects.update(project.id, { name: project.name }).then((result) => {
      if (!result) return
      // nome vazio: o backend mantém o anterior; refletimos isso aqui
      saved.current.name = result.name
      setProject((current) => (current ? { ...current, name: result.name } : current))
      latest.current.onTreeChanged()
    })
  }, [project, latest])

  const commitDescription = useCallback(() => {
    if (!project || project.description === saved.current.description) return
    saved.current.description = project.description
    void window.api.projects.update(project.id, { description: project.description })
  }, [project])

  useUnmountFlush(() => {
    commitName()
    commitDescription()
  })

  if (!project) return null

  const notes = actions.projectOf(project.id)?.notes ?? []

  return (
    <div className="pane">
      <header className="pane-top">
        <span className="crumb is-static">{t.project}</span>
        <div className="pane-head">
          <input
            ref={titleRef}
            className="title"
            value={project.name}
            placeholder={t.untitledProject}
            spellCheck={false}
            onChange={(event) => setProject({ ...project, name: event.target.value })}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
          <MoreMenu label={t.more}>
            <button type="button" onClick={() => actions.onCreateNote(project.id)}>
              {t.newNote}
            </button>
            <hr className="menu-sep" />
            <button
              type="button"
              className="danger-item"
              onClick={() => actions.onRequestDeleteProject({ id: project.id, name: project.name })}
            >
              {t.delete}
            </button>
          </MoreMenu>
          <PaneToolbar actions={actions} />
        </div>
      </header>
      <div className="pane-body">
        <textarea
          className="description"
          rows={2}
          value={project.description}
          placeholder={t.projectDescription}
          onChange={(event) => setProject({ ...project, description: event.target.value })}
          onBlur={commitDescription}
        />
        <section className="pane-section">
          <header className="section-head">
            <span className="section-label">{t.notesLabel}</span>
            <button
              type="button"
              className="text-action"
              onClick={() => actions.onCreateNote(project.id)}
            >
              {t.newNote}
            </button>
          </header>
          <NoteList
            notes={notes}
            canSplit
            onOpen={(noteId) => actions.onSelect({ kind: 'note', projectId: project.id, noteId })}
            onOpenInSplit={(noteId) =>
              actions.onOpenInSplit({ kind: 'note', projectId: project.id, noteId })
            }
          />
        </section>
      </div>
      <Attachments projectId={project.id} noteId={null} />
    </div>
  )
}
