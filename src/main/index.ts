import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import iconPng from '../../resources/icon.png?asset'
import iconIco from '../../resources/icon.ico?asset'
import {
  createNote,
  createProject,
  deleteNote,
  deleteProject,
  reorderProjects,
  getNote,
  getProject,
  listAttachments,
  listTree,
  openDatabase,
  searchMemory,
  updateNote,
  updateProject
} from './db'
import { attachmentPath, removeAttachmentFile, removeProjectFiles, storeDroppedFile } from './files'

let userData = ''

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 860,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    title: 'Notes',
    icon: process.platform === 'win32' ? iconIco : iconPng,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('projects.tree', () => listTree())
  ipcMain.handle('projects.create', (_event, name: string) => createProject(name))
  ipcMain.handle('projects.get', (_event, id: number) => getProject(id))
  ipcMain.handle(
    'projects.update',
    (_event, id: number, patch: { name?: string; description?: string }) => updateProject(id, patch)
  )
  ipcMain.handle('projects.delete', (_event, id: number) => {
    deleteProject(id)
    removeProjectFiles(userData, id)
  })
  ipcMain.handle('projects.reorder', (_event, ids: number[]) => {
    reorderProjects(ids)
  })

  ipcMain.handle('notes.create', (_event, projectId: number, title: string) =>
    createNote(projectId, title)
  )
  ipcMain.handle('notes.get', (_event, id: number) => getNote(id))
  ipcMain.handle(
    'notes.update',
    (_event, id: number, patch: { title?: string; bodyJson?: string; completed?: boolean }) =>
      updateNote(id, patch)
  )
  ipcMain.handle('notes.delete', (_event, id: number) => {
    deleteNote(id)
  })

  ipcMain.handle('attachments.list', (_event, projectId: number, noteId?: number | null) =>
    listAttachments(projectId, noteId)
  )
  ipcMain.handle(
    'attachments.add',
    (_event, projectId: number, noteId: number | null, paths: string[]) =>
      paths.map((sourcePath) =>
        storeDroppedFile(userData, { projectId, noteId, sourcePath })
      )
  )
  ipcMain.handle('attachments.pick', async (_event, projectId: number, noteId: number | null) => {
    const picked = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    })
    if (picked.canceled) return []
    return picked.filePaths.map((sourcePath) =>
      storeDroppedFile(userData, { projectId, noteId, sourcePath })
    )
  })
  ipcMain.handle('attachments.open', async (_event, id: number) => {
    await shell.openPath(attachmentPath(userData, id))
  })
  ipcMain.handle('attachments.remove', (_event, id: number) => {
    removeAttachmentFile(userData, id)
  })

  ipcMain.handle('memory.search', (_event, query: string) => searchMemory(query))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.notes.app')
  userData = app.getPath('userData')
  openDatabase(userData)
  registerIpc()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
