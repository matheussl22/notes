import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import { Extension, getSchema, type Editor } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'
import { CodeBlockView } from '../editor/CodeBlockView'
import { parseJson, sanitizeDoc } from '../editor/document'
import { ImageView } from '../editor/ImageView'
import { dropImages, pasteImages, pickImages } from '../editor/image-upload'
import { linkTargetFromSelection, type LinkTarget } from '../editor/link-target'
import { LinkPopover } from '../editor/LinkPopover'
import { SelectionMenu } from '../editor/SelectionMenu'
import { notesEditorExtensions } from '../editor/setup'
import { slashExtension } from '../editor/slash-extension'
import { TableMenu } from '../editor/TableMenu'
import { Toolbar } from '../editor/Toolbar'
import { useSettings } from '../settings-context'

type Props = {
  noteId: number
  /** projeto da nota: imagens coladas/arrastadas são salvas dentro dele */
  projectId: number
  /** conteúdo inicial; o componente é remontado (key) quando a nota muda */
  initialJson: string
  onChange: (json: string) => void
}

const SAVE_DELAY = 350

/** Orquestra o Tiptap: extensões, menus, imagens e salvamento com debounce. */
function NoteEditorImpl({ noteId, projectId, initialJson, onChange }: Props): React.JSX.Element {
  const { t, locale } = useSettings()
  const root = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<number>(0)
  // último documento ainda não gravado; null quando não há nada pendente.
  // Guardamos o nó (imutável) e só serializamos ao gravar: JSON.stringify do
  // documento inteiro a cada tecla trava notas grandes.
  const pending = useRef<PmNode | null>(null)
  // instância do editor para handlers criados antes dele existir (paste/drop/slash)
  const editorRef = useRef<Editor | null>(null)
  const [link, setLink] = useState<LinkTarget | null>(null)
  const imageContext = useMemo(() => ({ projectId, noteId }), [projectId, noteId])

  // abre o popover de link para a seleção atual (Ctrl+K, toolbar, bubble menu)
  const openLink = useCallback((target: Editor) => {
    if (target.isActive('codeBlock')) return
    setLink(linkTargetFromSelection(target))
  }, [])
  const closeLink = useCallback(() => setLink(null), [])

  // extensões e conteúdo inicial são fixos pela vida do componente (remonta via key)
  const extensions = useMemo(() => {
    const base = notesEditorExtensions(t.editorPlaceholder, {
      image: ReactNodeViewRenderer(ImageView),
      codeBlock: ReactNodeViewRenderer(CodeBlockView)
    })
    const shortcuts = Extension.create({
      name: 'notesShortcuts',
      addKeyboardShortcuts() {
        const { editor: current } = this
        return {
          'Mod-k': () => {
            openLink(current)
            return true
          }
        }
      }
    })
    const slash = slashExtension({
      locale,
      empty: t.slashEmpty,
      pickImage: (target) => pickImages(target, imageContext)
    })
    return [...base, shortcuts, slash]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const content = useMemo(() => {
    const result = sanitizeDoc(parseJson(initialJson), getSchema(extensions))
    if (result.dropped.length) {
      console.warn(`[editor] nota ${noteId}: tipos desconhecidos removidos:`, result.dropped)
    }
    return result.doc
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    enableContentCheck: true,
    onCreate: ({ editor: created }) => {
      editorRef.current = created
    },
    onContentError: ({ error }) => {
      console.warn(`[editor] nota ${noteId}: conteúdo inválido, mantendo o que foi possível`, error)
    },
    editorProps: {
      attributes: { class: 'doc' },
      handlePaste: (_view, event) =>
        editorRef.current ? pasteImages(editorRef.current, imageContext, event) : false,
      handleDrop: (view, event, _slice, moved) =>
        editorRef.current ? dropImages(editorRef.current, imageContext, view, event, moved) : false,
      // Ctrl/Cmd+clique abre o link no navegador (o main redireciona o window.open)
      handleClick: (_view, _pos, event) => {
        if (!(event.ctrlKey || event.metaKey)) return false
        const anchor = (event.target as HTMLElement | null)?.closest('a[href]')
        const href = anchor?.getAttribute('href')
        if (!href) return false
        event.preventDefault()
        window.open(href)
        return true
      }
    },
    onUpdate: ({ editor: current }) => {
      pending.current = current.state.doc
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        const doc = pending.current
        pending.current = null
        if (doc) onChange(JSON.stringify(doc.toJSON()))
      }, SAVE_DELAY)
    }
  })

  // ao desmontar (troca de nota, fechamento do painel), grava o que estiver pendente
  useEffect(() => {
    return () => {
      window.clearTimeout(saveTimer.current)
      if (pending.current !== null) {
        onChange(JSON.stringify(pending.current.toJSON()))
        pending.current = null
      }
    }
  }, [onChange])

  if (!editor) return <div className="doc-skeleton" />

  return (
    <div className="editor" ref={root}>
      <Toolbar
        editor={editor}
        onLink={() => openLink(editor)}
        onImage={() => pickImages(editor, imageContext)}
      />
      <EditorContent editor={editor} />
      <SelectionMenu editor={editor} onLink={() => openLink(editor)} />
      <TableMenu editor={editor} />
      {link && <LinkPopover editor={editor} target={link} container={root} onClose={closeLink} />}
    </div>
  )
}

/**
 * `initialJson` só vale na montagem; o painel o atualiza a cada gravação (para
 * remontagens por troca de idioma), e isso não deve re-renderizar o editor.
 */
export const NoteEditor = memo(
  NoteEditorImpl,
  (prev, next) =>
    prev.noteId === next.noteId &&
    prev.projectId === next.projectId &&
    prev.onChange === next.onChange
)
