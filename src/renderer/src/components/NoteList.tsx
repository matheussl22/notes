import type { ProjectTree } from '../../../shared/types'
import { displayNoteTitle, isUntitledNote } from '../i18n'
import { useSettings } from '../settings-context'
import { IconChevronDown, IconSplit } from './Icons'

type NoteRow = ProjectTree['notes'][number]

type Props = {
  notes: NoteRow[]
  onOpen: (noteId: number) => void
  onOpenInSplit: (noteId: number) => void
  /** com um só painel, o ícone de split ainda faz sentido; com dois também (substitui o outro) */
  canSplit: boolean
}

/** Linhas compactas das notas de um projeto; arquivadas ficam numa seção recolhida. */
export function NoteList({ notes, onOpen, onOpenInSplit, canSplit }: Props): React.JSX.Element {
  const { t } = useSettings()
  const active = notes.filter((note) => !note.completed)
  const archived = notes.filter((note) => note.completed)

  const row = (note: NoteRow): React.JSX.Element => (
    <li key={note.id} className={note.completed ? 'is-archived' : ''}>
      <button
        type="button"
        className={`note-row ${isUntitledNote(note.title) ? 'is-untitled' : ''}`}
        onClick={() => onOpen(note.id)}
      >
        {displayNoteTitle(note.title, t)}
      </button>
      {canSplit && (
        <button
          type="button"
          className="row-tool"
          title={t.openInSplit}
          onClick={() => onOpenInSplit(note.id)}
        >
          <IconSplit />
        </button>
      )}
    </li>
  )

  return (
    <div className="note-list">
      {notes.length === 0 && <p className="pane-muted">{t.noNotes}</p>}
      {active.length > 0 && <ul>{active.map(row)}</ul>}
      {archived.length > 0 && (
        <details className="archived-block">
          <summary>
            <IconChevronDown />
            {t.archivedCount(archived.length)}
          </summary>
          <ul>{archived.map(row)}</ul>
        </details>
      )}
    </div>
  )
}
