/**
 * Imagens no corpo da nota: colar, arrastar do explorador e escolher arquivo.
 * Nunca base64 no documento: o arquivo vai para o disco via `window.api.images`
 * e o nó recebe `notes-file://attachment/<id>`.
 */
import type { Editor, JSONContent } from '@tiptap/core'
import type { EditorView } from '@tiptap/pm/view'
import type { InlineImage } from '../../../shared/types'

export type ImageContext = { projectId: number; noteId: number }

export function imageNode(image: InlineImage): JSONContent {
  return {
    type: 'image',
    attrs: { src: image.url, alt: image.filename, title: image.filename }
  }
}

/**
 * Acompanha uma posição pelas transações seguintes (o usuário pode continuar
 * digitando enquanto o arquivo é salvo). Devolve a função que para de seguir
 * e entrega a posição atualizada.
 */
export function trackPosition(editor: Editor, pos: number): () => number {
  let current = pos
  const handler = ({
    transaction
  }: {
    transaction: { mapping: { map: (p: number) => number } }
  }): void => {
    current = transaction.mapping.map(current)
  }
  editor.on('transaction', handler)
  return () => {
    editor.off('transaction', handler)
    return current
  }
}

/** Insere as imagens na posição (seguida durante a espera) quando o salvamento terminar. */
export async function insertImagesWhenReady(
  editor: Editor,
  pos: number | null,
  pending: Promise<InlineImage[]>
): Promise<void> {
  const stop = trackPosition(editor, pos ?? editor.state.selection.from)
  let images: InlineImage[] = []
  try {
    images = await pending
  } catch (error) {
    console.warn('[editor] falha ao salvar imagem', error)
  }
  const target = stop()
  if (editor.isDestroyed || images.length === 0) return
  const clamped = Math.min(target, editor.state.doc.content.size)
  editor.chain().focus().insertContentAt(clamped, images.map(imageNode)).run()
}

export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** HTML "de verdade" (texto ou tabela) tem prioridade sobre a imagem que o Excel/Word põe junto. */
function htmlHasContent(html: string): boolean {
  if (!html.trim()) return false
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return Boolean(doc.body.textContent?.trim()) || doc.body.querySelector('table') !== null
}

/** `editorProps.handlePaste`: imagem do clipboard → disco → nó. */
export function pasteImages(editor: Editor, ctx: ImageContext, event: ClipboardEvent): boolean {
  const data = event.clipboardData
  if (!data) return false
  const files = Array.from(data.items)
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
  if (files.length === 0) return false
  if (htmlHasContent(data.getData('text/html'))) return false

  event.preventDefault()
  void insertImagesWhenReady(
    editor,
    null,
    Promise.all(
      files.map(async (file) =>
        window.api.images.saveDataUrl(
          ctx.projectId,
          ctx.noteId,
          await readAsDataUrl(file),
          file.name
        )
      )
    )
  )
  return true
}

/** `editorProps.handleDrop`: arquivos de imagem do explorador na posição do drop. */
export function dropImages(
  editor: Editor,
  ctx: ImageContext,
  view: EditorView,
  event: DragEvent,
  moved: boolean
): boolean {
  if (moved) return false
  const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
    file.type.startsWith('image/')
  )
  if (files.length === 0) return false

  event.preventDefault()
  const pos =
    view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from
  void insertImagesWhenReady(
    editor,
    pos,
    window.api.images.saveFiles(ctx.projectId, ctx.noteId, files)
  )
  return true
}

/** Toolbar / menu "/": abre o seletor e insere na posição do cursor. */
export function pickImages(editor: Editor, ctx: ImageContext): void {
  void insertImagesWhenReady(editor, null, window.api.images.pick(ctx.projectId, ctx.noteId))
}
