import { copyFileSync, mkdirSync, rmSync, statSync, unlinkSync } from 'fs'
import { basename, extname, join } from 'path'
import { randomUUID } from 'crypto'
import { addAttachment, deleteAttachment, getAttachmentRow } from './db'

export function filesRoot(userData: string): string {
  const root = join(userData, 'files')
  mkdirSync(root, { recursive: true })
  return root
}

function safeName(filename: string): string {
  const base = basename(filename).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
  return base || 'arquivo'
}

export function storeDroppedFile(
  userData: string,
  input: { projectId: number; noteId: number | null; sourcePath: string; mime?: string }
): ReturnType<typeof addAttachment> {
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
    size
  })
}

export function attachmentPath(userData: string, id: number): string {
  const row = getAttachmentRow(id)
  return join(filesRoot(userData), String(row.project_id), row.stored_name)
}

export function removeAttachmentFile(userData: string, id: number): void {
  const row = deleteAttachment(id)
  if (!row) return
  try {
    unlinkSync(join(filesRoot(userData), String(row.project_id), row.stored_name))
  } catch {
    // arquivo já pode ter sido removido à mão
  }
}

export function removeProjectFiles(userData: string, projectId: number): void {
  try {
    rmSync(join(filesRoot(userData), String(projectId)), { recursive: true, force: true })
  } catch {
    // pasta pode não existir
  }
}
