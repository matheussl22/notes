import { Fragment, useRef, useState } from 'react'
import type { ProjectTree } from '../../../shared/types'
import { useSettings } from '../settings-context'
import {
  DEFAULT_RATIO,
  RATIO_KEY,
  parseNoteTransfer,
  parseRatio,
  type Selection,
  type Workspace as WorkspaceState
} from '../workspace'
import { readStorage, writeStorage } from './hooks'
import { NotePane } from './NotePane'
import { PaneToolbar } from './PaneToolbar'
import { ProjectPane } from './ProjectPane'
import { SplitDivider } from './SplitDivider'

export type PaneActions = {
  /** o usuário interagiu com este painel: torná-lo o ativo */
  onActivate: () => void
  onClose: () => void
  /** abrir um segundo painel a partir deste */
  onSplit: () => void
  onSwap: () => void
  /** "Abrir ao lado" do próprio conteúdo: manda-o para o outro painel */
  onMoveAside: () => void
  canSplit: boolean
  canClose: boolean
  canSwap: boolean
  /** trocar o que este painel mostra (ex.: abrir uma nota a partir do projeto) */
  onSelect: (selection: Selection) => void
  /** abrir no outro painel (criando-o se preciso) */
  onOpenInSplit: (selection: Selection) => void
  onCreateNote: (projectId: number) => void
  onRequestDeleteProject: (project: { id: number; name: string }) => void
  onRequestDeleteNote: (note: { id: number; projectId: number }) => void
  /** algo que aparece na árvore mudou (título, arquivamento, criação) */
  onTreeChanged: () => void
  /** projeto na árvore atual (nome e notas), para breadcrumb e lista */
  projectOf: (projectId: number) => ProjectTree | undefined
}

/** alvo de um arraste de nota: painel específico, ou "abrir ao lado" do painel único */
export type DropTarget = number | 'split'

type Props = {
  workspace: WorkspaceState
  paneActions: (index: number) => PaneActions
  onDropSelection: (target: DropTarget, selection: Selection) => void
  /** false no harness de screenshot: não grava proporção */
  persist: boolean
}

function isNoteDrag(event: React.DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes('text/note')
}

/**
 * Área principal: 1 ou 2 painéis lado a lado, divisor arrastável e zona de
 * soltura para notas vindas da sidebar. Cada painel carrega seus próprios dados.
 */
export function WorkspaceView({
  workspace,
  paneActions,
  onDropSelection,
  persist
}: Props): React.JSX.Element {
  const { t } = useSettings()
  const ref = useRef<HTMLElement>(null)
  const [ratio, setRatio] = useState(() => parseRatio(readStorage(RATIO_KEY)))
  const [resizing, setResizing] = useState(false)
  const [drop, setDrop] = useState<DropTarget | null>(null)
  const split = workspace.panes.length > 1

  const commitRatio = (value: number): void => {
    if (persist) writeStorage(RATIO_KEY, String(value))
  }

  const targetAt = (clientX: number): DropTarget | null => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return null
    const x = (clientX - rect.left) / rect.width
    if (!split) return x >= 0.5 ? 'split' : null
    return x < ratio ? 0 : 1
  }

  const dropStyle = (target: DropTarget): React.CSSProperties => {
    if (target === 'split') return { left: '50%', right: 0 }
    return target === 0
      ? { left: 0, width: `${ratio * 100}%` }
      : { left: `${ratio * 100}%`, right: 0 }
  }

  const classes = ['workspace', split && 'is-split', resizing && 'is-resizing']
  return (
    <main
      ref={ref}
      className={classes.filter(Boolean).join(' ')}
      onDragOver={(event) => {
        if (!isNoteDrag(event)) return
        event.preventDefault()
        setDrop(targetAt(event.clientX))
      }}
      onDragLeave={(event) => {
        if (!ref.current?.contains(event.relatedTarget as Node)) setDrop(null)
      }}
      onDrop={(event) => {
        if (!isNoteDrag(event)) return
        event.preventDefault()
        setDrop(null)
        const selection = parseNoteTransfer(event.dataTransfer.getData('text/note'))
        const target = targetAt(event.clientX)
        if (selection && target !== null) onDropSelection(target, selection)
      }}
    >
      {workspace.panes.map((selection, index) => {
        const actions = paneActions(index)
        const isActive = index === workspace.active
        const grow = split ? (index === 0 ? ratio : 1 - ratio) : 1
        return (
          <Fragment key={index}>
            {index === 1 && (
              <SplitDivider
                containerRef={ref}
                title={t.resizeHint}
                onDragging={setResizing}
                onChange={setRatio}
                onCommit={() => commitRatio(ratio)}
                onReset={() => {
                  setRatio(DEFAULT_RATIO)
                  commitRatio(DEFAULT_RATIO)
                }}
              />
            )}
            <section
              className={`pane-slot ${isActive ? 'is-active' : ''}`}
              style={{ flex: `${grow} 1 0px` }}
              onMouseDownCapture={actions.onActivate}
              onFocusCapture={actions.onActivate}
            >
              {selection.kind === 'none' && (
                <div className="empty-main">
                  <p>{t.emptyHint}</p>
                  <ul className="empty-keys">
                    {actions.canSplit && (
                      <li>
                        <kbd>Ctrl</kbd>
                        <kbd>\</kbd>
                        <span>{t.shortcutSplit}</span>
                      </li>
                    )}
                    <li>
                      <kbd>Ctrl</kbd>
                      <kbd>N</kbd>
                      <span>{t.shortcutNewNote}</span>
                    </li>
                  </ul>
                </div>
              )}
              {selection.kind === 'none' && (actions.canClose || actions.canSplit) && (
                <div className="pane-float">
                  <PaneToolbar actions={actions} />
                </div>
              )}
              {selection.kind === 'project' && (
                <ProjectPane
                  key={`p-${selection.projectId}`}
                  projectId={selection.projectId}
                  actions={actions}
                />
              )}
              {selection.kind === 'note' && (
                <NotePane
                  key={`n-${selection.noteId}`}
                  noteId={selection.noteId}
                  actions={actions}
                />
              )}
            </section>
          </Fragment>
        )
      })}
      {drop !== null && <div className="drop-hint" style={dropStyle(drop)} />}
    </main>
  )
}
