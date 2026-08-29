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
  createdAt: string
}

export type MemoryHit = {
  kind: 'project' | 'note' | 'task' | 'attachment'
  refId: number
  projectId: number
  title: string
  body: string
}

export type ProjectTree = Project & {
  notes: Pick<Note, 'id' | 'title' | 'completed'>[]
}

export const EMPTY_DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }]
})
