/**
 * Arquivos em disco: anexos, imagens inline do editor e limpeza ao apagar.
 */
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  closeDatabase,
  createNote,
  createProject,
  deleteNote,
  deleteProject,
  listAttachments,
  openDatabase,
  searchMemory
} from '../../src/main/db.ts'
import {
  attachmentPath,
  isImagePath,
  mimeForImagePath,
  removeAttachmentFile,
  removeNoteFiles,
  removeProjectFiles,
  storeDataUrlImage,
  storeDroppedFile,
  storeImageFile
} from '../../src/main/files.ts'

// PNG 1x1 transparente
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

let userData = ''

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'notes-files-'))
  openDatabase(userData)
})

afterEach(() => {
  closeDatabase()
  rmSync(userData, { recursive: true, force: true })
})

describe('imagens inline', () => {
  it('salva data URL como arquivo, fora da lista de anexos e da busca', () => {
    const project = createProject('P')
    const note = createNote(project.id, 'N')

    const image = storeDataUrlImage(userData, {
      projectId: project.id,
      noteId: note.id,
      dataUrl: `data:image/png;base64,${PNG_BASE64}`,
      name: 'planta baixa.png'
    })

    assert.equal(image.url, `notes-file://attachment/${image.attachmentId}`)
    assert.equal(image.filename, 'planta baixa.png')
    const path = attachmentPath(userData, image.attachmentId)
    assert.ok(path.endsWith('.png'))
    assert.ok(existsSync(path))
    assert.equal(readFileSync(path).length, Buffer.from(PNG_BASE64, 'base64').length)

    assert.equal(listAttachments(project.id, note.id).length, 0, 'inline não aparece nos anexos')
    assert.equal(listAttachments(project.id).length, 0)
    assert.equal(searchMemory('planta').length, 0, 'inline não entra na busca')
  })

  it('rejeita data URL que não é imagem', () => {
    const project = createProject('P')
    assert.throws(() =>
      storeDataUrlImage(userData, {
        projectId: project.id,
        noteId: null,
        dataUrl: 'data:text/plain;base64,aGVsbG8='
      })
    )
  })

  it('copia arquivo de imagem do disco como inline com mime pelo sufixo', () => {
    const project = createProject('P')
    const source = join(userData, 'foto.JPEG')
    writeFileSync(source, Buffer.from(PNG_BASE64, 'base64'))
    const image = storeImageFile(userData, {
      projectId: project.id,
      noteId: null,
      sourcePath: source
    })
    assert.equal(image.filename, 'foto.JPEG')
    assert.ok(existsSync(attachmentPath(userData, image.attachmentId)))
    assert.equal(listAttachments(project.id, null).length, 0)
  })

  it('reconhece extensões de imagem', () => {
    assert.equal(isImagePath('C:/x/a.png'), true)
    assert.equal(isImagePath('/x/a.webp'), true)
    assert.equal(isImagePath('/x/a.JPG'), true)
    assert.equal(isImagePath('/x/a.pdf'), false)
    assert.equal(mimeForImagePath('a.jpeg'), 'image/jpeg')
    assert.equal(mimeForImagePath('a.svg'), 'image/svg+xml')
    assert.equal(mimeForImagePath('a.txt'), '')
  })
})

describe('anexos e limpeza', () => {
  it('nome de arquivo com caracteres inválidos é saneado', () => {
    const project = createProject('P')
    const source = join(userData, 'ok.txt')
    writeFileSync(source, 'x')
    const stored = storeDroppedFile(userData, {
      projectId: project.id,
      noteId: null,
      sourcePath: source
    })
    assert.equal(stored.filename, 'ok.txt')
    assert.equal(stored.inline, false)
  })

  it('attachmentPath de id inexistente devolve null', () => {
    assert.equal(attachmentPath(userData, 999), null)
  })

  it('apagar nota remove do disco anexos e imagens inline dela', () => {
    const project = createProject('P')
    const note = createNote(project.id, 'N')
    const source = join(userData, 'contrato.txt')
    writeFileSync(source, 'contrato')

    const file = storeDroppedFile(userData, {
      projectId: project.id,
      noteId: note.id,
      sourcePath: source
    })
    const image = storeDataUrlImage(userData, {
      projectId: project.id,
      noteId: note.id,
      dataUrl: `data:image/png;base64,${PNG_BASE64}`
    })
    const filePath = attachmentPath(userData, file.id)
    const imagePath = attachmentPath(userData, image.attachmentId)
    assert.ok(existsSync(filePath))
    assert.ok(existsSync(imagePath))

    // mesma sequência do handler IPC notes.delete
    removeNoteFiles(userData, note.id)
    deleteNote(note.id)

    assert.equal(existsSync(filePath), false)
    assert.equal(existsSync(imagePath), false)
    assert.equal(attachmentPath(userData, file.id), null, 'linha do anexo saiu em cascata')
  })

  it('remover anexo apaga o arquivo e some da busca', () => {
    const project = createProject('P')
    const source = join(userData, 'relatorio.txt')
    writeFileSync(source, 'x')
    const file = storeDroppedFile(userData, {
      projectId: project.id,
      noteId: null,
      sourcePath: source
    })
    const path = attachmentPath(userData, file.id)
    assert.ok(searchMemory('relatorio').some((hit) => hit.kind === 'attachment'))
    removeAttachmentFile(userData, file.id)
    assert.equal(existsSync(path), false)
    assert.equal(searchMemory('relatorio').length, 0)
    // remover de novo não lança
    removeAttachmentFile(userData, file.id)
  })

  it('apagar projeto remove a pasta inteira', () => {
    const project = createProject('P')
    const source = join(userData, 'a.txt')
    writeFileSync(source, 'x')
    storeDroppedFile(userData, { projectId: project.id, noteId: null, sourcePath: source })
    const dir = join(userData, 'files', String(project.id))
    assert.ok(existsSync(dir))
    deleteProject(project.id)
    removeProjectFiles(userData, project.id)
    assert.equal(existsSync(dir), false)
  })
})
