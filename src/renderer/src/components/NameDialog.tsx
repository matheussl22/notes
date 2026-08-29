import { useEffect, useRef, useState } from 'react'

type Props = {
  title: string
  confirmLabel: string
  placeholder?: string
  cancelLabel: string
  danger?: boolean
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function NameDialog({
  title,
  confirmLabel,
  placeholder,
  cancelLabel,
  danger,
  onConfirm,
  onCancel
}: Props): React.JSX.Element {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      className="modal-backdrop"
      onClick={onCancel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
    >
      <form
        className="modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          const name = value.trim()
          if (!name && !danger) return
          onConfirm(name)
        }}
      >
        <h2>{title}</h2>
        {!danger && (
          <input
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
          />
        )}
        {danger && <p>{placeholder}</p>}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="submit" className={danger ? 'primary danger' : 'primary'}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
