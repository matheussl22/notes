import { useCallback, useEffect, useState } from 'react'
import type { Attachment } from '../../../shared/types'
import { useSettings } from '../settings'
import { IconClose, IconPlus } from './Icons'

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

type Props = {
  projectId: number
  noteId: number | null
}

export function Attachments({ projectId, noteId }: Props): React.JSX.Element {
  const { t } = useSettings()
  const [items, setItems] = useState<Attachment[]>([])
  const [over, setOver] = useState(false)

  const reload = useCallback(async () => {
    setItems(await window.api.attachments.list(projectId, noteId))
  }, [projectId, noteId])

  useEffect(() => {
    void reload()
  }, [reload])

  const addFiles = async (files: FileList | File[]): Promise<void> => {
    const list = Array.from(files)
    if (list.length === 0) return
    await window.api.attachments.addFiles(projectId, noteId, list)
    await reload()
  }

  return (
    <section
      className={`attachments ${over ? 'is-over' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
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
            await reload()
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
              <button type="button" className="link" onClick={() => void window.api.attachments.open(item.id)}>
                {item.filename}
              </button>
              <span className="size">{formatSize(item.size)}</span>
              <button
                type="button"
                className="remove"
                title={t.remove}
                onClick={async () => {
                  await window.api.attachments.remove(item.id)
                  await reload()
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
