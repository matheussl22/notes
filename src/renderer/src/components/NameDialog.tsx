import { useEffect, useRef, useState } from 'react'

type Props = {
  title: string
  confirmLabel: string
  /** texto do campo (modo nome) ou pergunta (modo confirmação) */
  placeholder?: string
  cancelLabel: string
  danger?: boolean
  onConfirm: (value: string) => void
  onCancel: () => void
}

/**
 * Diálogo modal para pedir um nome ou confirmar algo perigoso. Usa <dialog>
 * nativo: Esc cancela, foco fica preso, clique no fundo cancela, Enter confirma.
 */
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    ;(inputRef.current ?? confirmRef.current)?.focus()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        // o fundo é o próprio <dialog>; o conteúdo fica no <form>
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <form
        className="modal-body"
        onSubmit={(event) => {
          event.preventDefault()
          const name = value.trim()
          if (!name && !danger) return
          onConfirm(name)
        }}
      >
        <h2>{title}</h2>
        {danger ? (
          <p>{placeholder}</p>
        ) : (
          <input
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            spellCheck={false}
            onChange={(event) => setValue(event.target.value)}
          />
        )}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="submit"
            className={danger ? 'primary is-danger' : 'primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
