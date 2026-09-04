import { useEffect, useReducer, useState } from 'react'
import type { Attachment } from '../../../shared/types'
import { useSettings } from '../settings-context'
import { FileIcon } from './FileIcon'
import { IconClose, IconPlus } from './Icons'

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function hasFiles(event: React.DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

type Props = {
  projectId: number
  noteId: number | null
}

/**
 * Rodapé compacto do painel: lista de anexos (28px por item) e botão "Anexar".
 * Aceita arquivos arrastados do sistema; ignora outros arrastes (ex.: notas).
 */
export function Attachments({ projectId, noteId }: Props): React.JSX.Element {
  const { t } = useSettings()
  const [items, setItems] = useState<Attachment[]>([])
  const [over, setOver] = useState(false)
  // incrementa para recarregar depois de anexar/remover
  const [version, bump] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    let alive = true
    void window.api.attachments.list(projectId, noteId).then((list) => {
      if (alive) setItems(list)
    })
    return () => {
      alive = false
    }
  }, [projectId, noteId, version])

  const addFiles = async (files: FileList): Promise<void> => {
    const list = Array.from(files)
    if (list.length === 0) return
    await window.api.attachments.addFiles(projectId, noteId, list)
    bump()
  }

  return (
    <section
      className={`attachments ${over ? 'is-over' : ''} ${items.length === 0 ? 'is-empty' : ''}`}
      onDragOver={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOver(false)
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        setOver(false)
        void addFiles(event.dataTransfer.files)
      }}
    >
      <header>
        <span className="attach-label">{t.attachments}</span>
        <button
          type="button"
          className="attach-add"
          onClick={async () => {
            await window.api.attachments.pick(projectId, noteId)
            bump()
          }}
        >
          <IconPlus />
          {t.attach}
        </button>
      </header>
      {items.length > 0 && (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <span className="file-icon">
                <FileIcon filename={item.filename} mime={item.mime} />
              </span>
              <button
                type="button"
                className="link"
                title={item.filename}
                onClick={() => void window.api.attachments.open(item.id)}
              >
                {item.filename}
              </button>
              <span className="size">{formatSize(item.size)}</span>
              <button
                type="button"
                className="remove"
                title={t.remove}
                onClick={async () => {
                  await window.api.attachments.remove(item.id)
                  bump()
                }}
              >
                <IconClose />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
