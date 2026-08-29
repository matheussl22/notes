import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { Attachment, MemoryHit, Note, Project, ProjectTree } from '../shared/types'

const api = {
  projects: {
    tree: (): Promise<ProjectTree[]> => ipcRenderer.invoke('projects.tree'),
    create: (name: string): Promise<Project> => ipcRenderer.invoke('projects.create', name),
    get: (id: number): Promise<Project> => ipcRenderer.invoke('projects.get', id),
    update: (id: number, patch: { name?: string; description?: string }): Promise<Project> =>
      ipcRenderer.invoke('projects.update', id, patch),
    delete: (id: number): Promise<void> => ipcRenderer.invoke('projects.delete', id),
    reorder: (ids: number[]): Promise<void> => ipcRenderer.invoke('projects.reorder', ids)
  },
  notes: {
    create: (projectId: number, title: string): Promise<Note> =>
      ipcRenderer.invoke('notes.create', projectId, title),
    get: (id: number): Promise<Note> => ipcRenderer.invoke('notes.get', id),
    update: (
      id: number,
      patch: { title?: string; bodyJson?: string; completed?: boolean }
    ): Promise<Note> => ipcRenderer.invoke('notes.update', id, patch),
    delete: (id: number): Promise<void> => ipcRenderer.invoke('notes.delete', id)
  },
  attachments: {
    list: (projectId: number, noteId?: number | null): Promise<Attachment[]> =>
      ipcRenderer.invoke('attachments.list', projectId, noteId),
    addFiles: (projectId: number, noteId: number | null, files: File[]): Promise<Attachment[]> => {
      const paths = files.map((file) => webUtils.getPathForFile(file))
      return ipcRenderer.invoke('attachments.add', projectId, noteId, paths)
    },
    pick: (projectId: number, noteId: number | null): Promise<Attachment[]> =>
      ipcRenderer.invoke('attachments.pick', projectId, noteId),
    open: (id: number): Promise<void> => ipcRenderer.invoke('attachments.open', id),
    remove: (id: number): Promise<void> => ipcRenderer.invoke('attachments.remove', id)
  },
  memory: {
    search: (query: string): Promise<MemoryHit[]> => ipcRenderer.invoke('memory.search', query)
  }
}

export type NotesApi = typeof api

contextBridge.exposeInMainWorld('api', api)
