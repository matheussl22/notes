/**
 * Fluxo completo sem janela, mouse, teclado ou tela.
 * SQLite real + editor TipTap em DOM isolado (jsdom).
 */
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Editor } from '@tiptap/core'
import { ensureDom } from './dom.mjs'
import {
  closeDatabase,
  createNote,
  createProject,
  getDb,
  listAttachments,
  listTree,
  openDatabase,
  searchMemory,
  updateNote,
  updateProject
} from '../../src/main/db.ts'
import { attachmentPath, storeDroppedFile } from '../../src/main/files.ts'
import { notesEditorExtensions } from '../../src/renderer/src/editor/setup.ts'

let userData = ''
let editor = null

function createIsolatedEditor() {
  ensureDom()
  const root = document.createElement('div')
  document.body.appendChild(root)
  return new Editor({
    element: root,
    extensions: notesEditorExtensions(),
    content: '<p></p>'
  })
}

describe('fluxo: projeto, nota, editor e anexo', () => {
  beforeEach(() => {
    userData = mkdtempSync(join(tmpdir(), 'notes-e2e-'))
    openDatabase(userData)
    editor = createIsolatedEditor()
  })

  afterEach(() => {
    editor?.destroy()
    editor = null
    closeDatabase()
    rmSync(userData, { recursive: true, force: true })
  })

  it('cria projeto, edita nota no editor, anexa arquivo e indexa a memória', () => {
    const project = createProject('Reforma do consultório')
    assert.ok(project.id > 0)
    assert.equal(project.name, 'Reforma do consultório')

    const updatedProject = updateProject(project.id, {
      description: 'Sala pronta para atender em setembro.'
    })
    assert.match(updatedProject.description, /setembro/)

    const note = createNote(project.id, 'Orçamentos')
    assert.equal(note.projectId, project.id)
    assert.equal(note.completed, false)
    assert.equal(JSON.parse(note.bodyJson).type, 'doc')

    editor.commands.setContent('<p>Contexto da reunião com o João.</p>')
    editor.commands.toggleTaskList()
    editor.commands.insertContent('Pedir orçamento da clínica X')

    const afterEdit = updateNote(note.id, { bodyJson: JSON.stringify(editor.getJSON()) })
    assert.match(afterEdit.bodyText, /Contexto da reunião com o João/)
    assert.match(afterEdit.bodyText, /Pedir orçamento da clínica X/)

    const tasks = getDb()
      .prepare('SELECT text, done FROM tasks WHERE note_id = ? ORDER BY position')
      .all(note.id)
    assert.equal(tasks.length, 1)
    assert.match(tasks[0].text, /Pedir orçamento da clínica X/)
    assert.equal(tasks[0].done, 0)

    editor.commands.insertContent(' — prazo sexta')
    const afterRewrite = updateNote(note.id, { bodyJson: JSON.stringify(editor.getJSON()) })
    assert.match(afterRewrite.bodyText, /prazo sexta/)

    const source = join(userData, 'contrato-origem.txt')
    writeFileSync(source, 'contrato da clínica X')

    const projectFile = storeDroppedFile(userData, {
      projectId: project.id,
      noteId: null,
      sourcePath: source,
      mime: 'text/plain'
    })
    assert.equal(projectFile.filename, 'contrato-origem.txt')
    assert.equal(projectFile.noteId, null)
    assert.equal(
      readFileSync(attachmentPath(userData, projectFile.id), 'utf8'),
      'contrato da clínica X'
    )

    const noteFile = storeDroppedFile(userData, {
      projectId: project.id,
      noteId: note.id,
      sourcePath: source,
      mime: 'text/plain'
    })
    assert.equal(noteFile.noteId, note.id)

    const onProject = listAttachments(project.id, null)
    const onNote = listAttachments(project.id, note.id)
    assert.ok(onProject.some((item) => item.id === projectFile.id))
    assert.ok(onNote.some((item) => item.id === noteFile.id))
    assert.ok(!onProject.some((item) => item.id === noteFile.id))

    const archived = updateNote(note.id, { completed: true, title: 'Orçamentos (fechado)' })
    assert.equal(archived.completed, true)
    assert.equal(archived.title, 'Orçamentos (fechado)')

    const tree = listTree()
    assert.equal(tree.length, 1)
    assert.equal(tree[0].name, 'Reforma do consultório')
    assert.equal(tree[0].notes[0].completed, true)

    const hits = searchMemory('orçamento clínica')
    const kinds = hits.map((hit) => hit.kind)
    assert.ok(kinds.includes('task'))
    assert.ok(kinds.includes('note'))
    assert.ok(hits.some((hit) => hit.body.includes('clínica') || hit.title.includes('Orçamentos')))

    const fileHits = searchMemory('contrato-origem')
    assert.ok(fileHits.some((hit) => hit.kind === 'attachment'))
  })
})
