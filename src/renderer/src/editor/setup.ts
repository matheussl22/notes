import { Extension, type Extensions, type NodeViewRenderer } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import CodeBlock from '@tiptap/extension-code-block'
import Placeholder from '@tiptap/extension-placeholder'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import { NotesImage } from './image-extension'

/**
 * Node views React (imagem com alças, bloco de código com rótulo) são
 * opcionais: o componente injeta; os testes headless não passam nada.
 */
export type NotesNodeViews = {
  image?: NodeViewRenderer
  codeBlock?: NodeViewRenderer
}

export const TABLE_DEFAULTS = { rows: 3, cols: 3, withHeaderRow: true } as const

/** Ctrl+Alt+T insere uma tabela 3×3 com cabeçalho. */
const TableShortcut = Extension.create({
  name: 'tableShortcut',
  addKeyboardShortcuts() {
    return {
      'Mod-Alt-t': () => this.editor.commands.insertTable(TABLE_DEFAULTS)
    }
  }
})

/**
 * Extensões do editor. Usadas tanto pelo componente React quanto pelos testes
 * E2E (Editor headless em jsdom), então tudo aqui precisa funcionar sem DOM real
 * de navegador, sem React e sem `window.api`.
 */
export function notesEditorExtensions(placeholder = '', views: NotesNodeViews = {}): Extensions {
  const image = views.image
    ? NotesImage.extend({ addNodeView: () => views.image as NodeViewRenderer })
    : NotesImage
  const codeBlock = CodeBlock.configure({ exitOnTripleEnter: true, exitOnArrowDown: true })
  const codeBlockWithView = views.codeBlock
    ? codeBlock.extend({ addNodeView: () => views.codeBlock as NodeViewRenderer })
    : codeBlock

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        linkOnPaste: true
      },
      // registrado à parte para aceitar node view
      codeBlock: false
    }),
    codeBlockWithView,
    Placeholder.configure({ placeholder }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({
      resizable: true,
      cellMinWidth: 60,
      lastColumnResizable: true,
      allowTableNodeSelection: true
    }),
    TableRow,
    TableHeader,
    TableCell,
    image,
    Highlight,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Typography,
    TextStyle,
    Color,
    TableShortcut
  ]
}
