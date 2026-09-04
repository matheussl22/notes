export type Project = {
  id: number
  name: string
  description: string
  position: number
  createdAt: string
  updatedAt: string
}

export type Note = {
  id: number
  projectId: number
  title: string
  bodyJson: string
  bodyText: string
  completed: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export type Task = {
  id: number
  projectId: number
  noteId: number
  text: string
  done: boolean
  position: number
}

export type Attachment = {
  id: number
  projectId: number
  noteId: number | null
  filename: string
  mime: string
  size: number
  /** true para imagens inseridas dentro do corpo da nota (não aparecem na lista de anexos) */
  inline: boolean
  createdAt: string
}

/** Imagem salva em disco e referenciada pelo corpo da nota via `notes-file://attachment/<id>` */
export type InlineImage = {
  attachmentId: number
  url: string
  filename: string
  width: number | null
  height: number | null
}

export type MemoryHit = {
  kind: 'project' | 'note' | 'task' | 'attachment'
  refId: number
  projectId: number
  title: string
  body: string
}

export type ProjectTree = Project & {
  notes: Pick<Note, 'id' | 'title' | 'completed' | 'position'>[]
}

/** Informações do processo principal que o renderer lê no boot. */
export type AppInfo = {
  /** cena pedida pelo harness de screenshot (`NOTES_SHOT_SCENE`), ou null em uso normal */
  scene: string | null
  platform: NodeJS.Platform
  version: string
}

export const INLINE_IMAGE_SCHEME = 'notes-file'

export function inlineImageUrl(attachmentId: number): string {
  return `${INLINE_IMAGE_SCHEME}://attachment/${attachmentId}`
}

export const EMPTY_DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }]
})
