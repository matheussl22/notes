import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  AppInfo,
  Attachment,
  InlineImage,
  MemoryHit,
  Note,
  Project,
  ProjectTree
} from '../shared/types'

const api = {
  app: {
    info: (): Promise<AppInfo> => ipcRenderer.invoke('app.info')
  },
  projects: {
    tree: (): Promise<ProjectTree[]> => ipcRenderer.invoke('projects.tree'),
    create: (name: string): Promise<Project> => ipcRenderer.invoke('projects.create', name),
    get: (id: number): Promise<Project | null> => ipcRenderer.invoke('projects.get', id),
    update: (id: number, patch: { name?: string; description?: string }): Promise<Project | null> =>
      ipcRenderer.invoke('projects.update', id, patch),
    delete: (id: number): Promise<void> => ipcRenderer.invoke('projects.delete', id),
    reorder: (ids: number[]): Promise<void> => ipcRenderer.invoke('projects.reorder', ids)
  },
  notes: {
    create: (projectId: number, title: string): Promise<Note> =>
      ipcRenderer.invoke('notes.create', projectId, title),
    get: (id: number): Promise<Note | null> => ipcRenderer.invoke('notes.get', id),
    update: (
      id: number,
      patch: { title?: string; bodyJson?: string; completed?: boolean }
    ): Promise<Note | null> => ipcRenderer.invoke('notes.update', id, patch),
    delete: (id: number): Promise<void> => ipcRenderer.invoke('notes.delete', id),
    /** ordem completa das notas de um projeto, do topo para baixo */
    reorder: (projectId: number, ids: number[]): Promise<void> =>
      ipcRenderer.invoke('notes.reorder', projectId, ids)
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
  /** Imagens do corpo da nota. Ficam em disco e são referenciadas por `notes-file://attachment/<id>`. */
  images: {
    /** imagem colada (clipboard) ou lida via FileReader, em data URL base64 */
    saveDataUrl: (
      projectId: number,
      noteId: number | null,
      dataUrl: string,
      name?: string
    ): Promise<InlineImage> =>
      ipcRenderer.invoke('images.saveDataUrl', projectId, noteId, dataUrl, name),
    /** arquivos de imagem arrastados do explorador; ignora o que não for imagem */
    saveFiles: (
      projectId: number,
      noteId: number | null,
      files: File[]
    ): Promise<InlineImage[]> => {
      const paths = files.map((file) => webUtils.getPathForFile(file)).filter(Boolean)
      return ipcRenderer.invoke('images.saveFiles', projectId, noteId, paths)
    },
    /** abre o seletor de arquivos filtrado para imagens */
    pick: (projectId: number, noteId: number | null): Promise<InlineImage[]> =>
      ipcRenderer.invoke('images.pick', projectId, noteId)
  },
  memory: {
    search: (query: string): Promise<MemoryHit[]> => ipcRenderer.invoke('memory.search', query)
  }
}

export type NotesApi = typeof api

contextBridge.exposeInMainWorld('api', api)
