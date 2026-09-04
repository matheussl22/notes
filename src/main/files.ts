import { copyFileSync, mkdirSync, rmSync, statSync, unlinkSync, writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import { randomUUID } from 'crypto'
import type { Attachment, InlineImage } from '../shared/types'
import { inlineImageUrl } from '../shared/types'
import { addAttachment, attachmentRowsByNote, deleteAttachment, getAttachmentRow } from './db'

export function filesRoot(userData: string): string {
  const root = join(userData, 'files')
  mkdirSync(root, { recursive: true })
  return root
}

/** caracteres proibidos em nomes de arquivo no Windows */
const RESERVED_NAME_CHARS = /[<>:"/\\|?*]/g

/** troca caracteres reservados e de controle (código < 32) por `_` */
function safeName(filename: string): string {
  const base = Array.from(basename(filename))
    .map((char) => (char.charCodeAt(0) < 32 ? '_' : char))
    .join('')
    .replace(RESERVED_NAME_CHARS, '_')
  return base || 'arquivo'
}

const IMAGE_MIME_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/avif': '.avif'
}

const IMAGE_EXTENSIONS = new Set(Object.values(IMAGE_MIME_EXT).concat(['.jpeg']))

export function isImagePath(path: string): boolean {
  return IMAGE_EXTENSIONS.has(extname(path).toLowerCase())
}

export function mimeForImagePath(path: string): string {
  const ext = extname(path).toLowerCase()
  if (ext === '.jpeg') return 'image/jpeg'
  return Object.entries(IMAGE_MIME_EXT).find(([, value]) => value === ext)?.[0] ?? ''
}

export function storeDroppedFile(
  userData: string,
  input: {
    projectId: number
    noteId: number | null
    sourcePath: string
    mime?: string
    inline?: boolean
  }
): Attachment {
  const original = safeName(input.sourcePath)
  const storedName = `${randomUUID()}${extname(original)}`
  const dir = join(filesRoot(userData), String(input.projectId))
  mkdirSync(dir, { recursive: true })
  const dest = join(dir, storedName)
  copyFileSync(input.sourcePath, dest)

  const { size } = statSync(dest)

  return addAttachment({
    projectId: input.projectId,
    noteId: input.noteId,
    filename: original,
    storedName,
    mime: input.mime ?? '',
    size,
    inline: input.inline ?? false
  })
}

/**
 * Salva uma imagem colada/arrastada (data URL base64) como arquivo em disco,
 * registrada como anexo inline. Lança se o data URL não for de imagem.
 */
export function storeDataUrlImage(
  userData: string,
  input: { projectId: number; noteId: number | null; dataUrl: string; name?: string }
): InlineImage {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is.exec(input.dataUrl.trim())
  if (!match) throw new Error('data URL inválido: esperado uma imagem em base64')
  const mime = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')
  const ext = IMAGE_MIME_EXT[mime] ?? '.bin'
  const storedName = `${randomUUID()}${ext}`
  const dir = join(filesRoot(userData), String(input.projectId))
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, storedName), buffer)

  const filename = safeName(input.name?.trim() || `imagem${ext}`)
  const attachment = addAttachment({
    projectId: input.projectId,
    noteId: input.noteId,
    filename: extname(filename) ? filename : `${filename}${ext}`,
    storedName,
    mime,
    size: buffer.byteLength,
    inline: true
  })
  return toInlineImage(attachment)
}

/** Copia uma imagem do disco do usuário para dentro do projeto como anexo inline. */
export function storeImageFile(
  userData: string,
  input: { projectId: number; noteId: number | null; sourcePath: string }
): InlineImage {
  const attachment = storeDroppedFile(userData, {
    ...input,
    mime: mimeForImagePath(input.sourcePath),
    inline: true
  })
  return toInlineImage(attachment)
}

function toInlineImage(attachment: Attachment): InlineImage {
  return {
    attachmentId: attachment.id,
    url: inlineImageUrl(attachment.id),
    filename: attachment.filename,
    width: null,
    height: null
  }
}

export function attachmentPath(userData: string, id: number): string | null {
  const row = getAttachmentRow(id)
  if (!row) return null
  return join(filesRoot(userData), String(row.project_id), row.stored_name)
}

function unlinkQuiet(path: string): void {
  try {
    unlinkSync(path)
  } catch {
    // arquivo já pode ter sido removido à mão
  }
}

export function removeAttachmentFile(userData: string, id: number): void {
  const row = deleteAttachment(id)
  if (!row) return
  unlinkQuiet(join(filesRoot(userData), String(row.project_id), row.stored_name))
}

/** Apaga do disco todos os arquivos (anexos e imagens inline) de uma nota. Chamar antes de deleteNote. */
export function removeNoteFiles(userData: string, noteId: number): void {
  for (const row of attachmentRowsByNote(noteId)) {
    unlinkQuiet(join(filesRoot(userData), String(row.project_id), row.stored_name))
  }
}

export function removeProjectFiles(userData: string, projectId: number): void {
  try {
    rmSync(join(filesRoot(userData), String(projectId)), { recursive: true, force: true })
  } catch {
    // pasta pode não existir
  }
}
