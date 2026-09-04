import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join } from 'path'
import { mkdtempSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import iconPng from '../../resources/icon.png?asset'
import iconIco from '../../resources/icon.ico?asset'
import type { AppInfo } from '../shared/types'
import { INLINE_IMAGE_SCHEME } from '../shared/types'
import {
  createNote,
  createProject,
  deleteNote,
  deleteProject,
  reorderNotes,
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
import {
  attachmentPath,
  isImagePath,
  removeAttachmentFile,
  removeNoteFiles,
  removeProjectFiles,
  storeDataUrlImage,
  storeDroppedFile,
  storeImageFile
} from './files'
import { seedSampleData } from './seed'

let userData = ''

/**
 * Modo screenshot: `NOTES_SHOT_DIR=<pasta> NOTES_SHOT_SCENE=<cena> electron .`
 * Usa um userData temporário com dados de exemplo, renderiza offscreen em 1280x800,
 * salva `<pasta>/<cena>.png` e encerra. O renderer lê a cena via `app.info`.
 */
const shot = process.env['NOTES_SHOT_DIR']
  ? {
      dir: process.env['NOTES_SHOT_DIR'],
      scene: process.env['NOTES_SHOT_SCENE'] || 'home',
      name: process.env['NOTES_SHOT_NAME'] || process.env['NOTES_SHOT_SCENE'] || 'home',
      width: Number(process.env['NOTES_SHOT_WIDTH'] || 1280),
      height: Number(process.env['NOTES_SHOT_HEIGHT'] || 800),
      delay: Number(process.env['NOTES_SHOT_DELAY'] || 1200)
    }
  : null

protocol.registerSchemesAsPrivileged([
  {
    scheme: INLINE_IMAGE_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: shot?.width ?? 1180,
    height: shot?.height ?? 760,
    minWidth: 860,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    title: 'Notes',
    icon: process.platform === 'win32' ? iconIco : iconPng,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      offscreen: Boolean(shot)
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (!shot) mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (/^https?:/i.test(details.url)) void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // links http(s) dentro do editor abrem no navegador, nunca dentro do app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  })

  // em modo screenshot, tema e idioma vêm por query string (lidos em settings.tsx)
  const query: Record<string, string> = {}
  if (shot && process.env['NOTES_SHOT_THEME']) query['theme'] = process.env['NOTES_SHOT_THEME']
  if (shot && process.env['NOTES_SHOT_LOCALE']) query['locale'] = process.env['NOTES_SHOT_LOCALE']

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const url = new URL(process.env['ELECTRON_RENDERER_URL'])
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
    mainWindow.loadURL(url.toString())
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { query })
  }

  if (shot) {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const image = await mainWindow.webContents.capturePage()
          mkdirSync(shot.dir, { recursive: true })
          writeFileSync(join(shot.dir, `${shot.name}.png`), image.toPNG())
        } catch (error) {
          console.error('screenshot falhou', error)
          process.exitCode = 1
        } finally {
          app.quit()
        }
      }, shot.delay)
    })
  }

  return mainWindow
}

function registerProtocol(): void {
  protocol.handle(INLINE_IMAGE_SCHEME, (request) => {
    const id = Number(new URL(request.url).pathname.replace(/^\/+/, ''))
    const path = Number.isInteger(id) ? attachmentPath(userData, id) : null
    if (!path) return new Response('not found', { status: 404 })
    return net.fetch(pathToFileURL(path).toString())
  })
}

function registerIpc(): void {
  ipcMain.handle('app.info', (): AppInfo => ({
    scene: shot?.scene ?? null,
    platform: process.platform,
    version: app.getVersion()
  }))

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
  ipcMain.handle('notes.reorder', (_event, projectId: number, ids: number[]) => {
    reorderNotes(projectId, ids)
  })
  ipcMain.handle('notes.delete', (_event, id: number) => {
    removeNoteFiles(userData, id)
    deleteNote(id)
  })

  ipcMain.handle('attachments.list', (_event, projectId: number, noteId?: number | null) =>
    listAttachments(projectId, noteId)
  )
  ipcMain.handle(
    'attachments.add',
    (_event, projectId: number, noteId: number | null, paths: string[]) =>
      paths.map((sourcePath) => storeDroppedFile(userData, { projectId, noteId, sourcePath }))
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
    const path = attachmentPath(userData, id)
    if (path) await shell.openPath(path)
  })
  ipcMain.handle('attachments.remove', (_event, id: number) => {
    removeAttachmentFile(userData, id)
  })

  ipcMain.handle(
    'images.saveDataUrl',
    (_event, projectId: number, noteId: number | null, dataUrl: string, name?: string) =>
      storeDataUrlImage(userData, { projectId, noteId, dataUrl, name })
  )
  ipcMain.handle(
    'images.saveFiles',
    (_event, projectId: number, noteId: number | null, paths: string[]) =>
      paths
        .filter(isImagePath)
        .map((sourcePath) => storeImageFile(userData, { projectId, noteId, sourcePath }))
  )
  ipcMain.handle('images.pick', async (_event, projectId: number, noteId: number | null) => {
    const picked = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'] }
      ]
    })
    if (picked.canceled) return []
    return picked.filePaths
      .filter(isImagePath)
      .map((sourcePath) => storeImageFile(userData, { projectId, noteId, sourcePath }))
  })

  ipcMain.handle('memory.search', (_event, query: string) => searchMemory(query))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.notes.app')
  if (shot) {
    userData = mkdtempSync(join(tmpdir(), 'notes-shot-'))
    app.setPath('userData', userData)
  } else {
    userData = app.getPath('userData')
  }
  openDatabase(userData)
  if (shot) seedSampleData()
  registerProtocol()
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
