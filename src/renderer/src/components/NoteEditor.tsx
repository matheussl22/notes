import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import { EMPTY_DOC } from '../../../shared/types'
import { notesEditorExtensions } from '../editor/setup'

type Props = {
  noteId: number
  initialJson: string
  placeholder: string
  labels: { bold: string; italic: string; heading: string; list: string; checkbox: string }
  onChange: (json: string) => void
}

function parseJson(value: string): JSONContent {
  try {
    return JSON.parse(value) as JSONContent
  } catch {
    return JSON.parse(EMPTY_DOC) as JSONContent
  }
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
}

export function NoteEditor({
  noteId,
  initialJson,
  placeholder,
  labels,
  onChange
}: Props): React.JSX.Element {
  const saveTimer = useRef<number>(0)
  const editor = useEditor({
    extensions: notesEditorExtensions(placeholder),
    content: parseJson(initialJson),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'doc'
      }
    },
    onUpdate: ({ editor: current }) => {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        onChange(JSON.stringify(current.getJSON()))
      }, 350)
    }
  })

  useEffect(() => {
    if (!editor) return
    const next = parseJson(initialJson)
    const current = JSON.stringify(editor.getJSON())
    if (current !== JSON.stringify(next)) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, noteId, initialJson])

  useEffect(() => {
    return () => {
      window.clearTimeout(saveTimer.current)
      if (editor) onChange(JSON.stringify(editor.getJSON()))
    }
  }, [editor, onChange])

  if (!editor) return <div className="doc-skeleton" />

  return (
    <div className="editor">
      <div className="toolbar">
        <button
          type="button"
          title={labels.bold}
          className={editor.isActive('bold') ? 'is-on' : ''}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <svg {...iconProps}>
            <path d="M7 5h6.2a3.2 3.2 0 0 1 0 6.4H7V5z" />
            <path d="M7 11.4h7a3.3 3.3 0 0 1 0 6.6H7v-6.6z" />
          </svg>
        </button>
        <button
          type="button"
          title={labels.italic}
          className={editor.isActive('italic') ? 'is-on' : ''}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <svg {...iconProps}>
            <path d="M11 5h8M5 19h8M15 5l-6 14" />
          </svg>
        </button>
        <span className="sep" />
        <button
          type="button"
          title={labels.heading}
          className={editor.isActive('heading', { level: 2 }) ? 'is-on' : ''}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <svg {...iconProps}>
            <path d="M6 5v14M18 5v14M6 12h12" />
          </svg>
        </button>
        <button
          type="button"
          title={labels.list}
          className={editor.isActive('bulletList') ? 'is-on' : ''}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <svg {...iconProps}>
            <circle cx="5" cy="7" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="5" cy="12" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="5" cy="17" r="1.1" fill="currentColor" stroke="none" />
            <path d="M9 7h11M9 12h11M9 17h11" />
          </svg>
        </button>
        <button
          type="button"
          title={labels.checkbox}
          className={editor.isActive('taskList') ? 'is-on' : ''}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <svg {...iconProps}>
            <rect x="4" y="4" width="16" height="16" rx="2.5" />
            <path d="M8 12.2 10.8 15 16.2 9" />
          </svg>
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
