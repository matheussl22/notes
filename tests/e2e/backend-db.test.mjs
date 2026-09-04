/**
 * Banco: migração de bases antigas, ordem de notas, busca por prefixo,
 * leituras de itens inexistentes e semântica de updateNote.
 */
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  closeDatabase,
  createNote,
  createProject,
  deleteNote,
  deleteProject,
  getDb,
  getNote,
  getProject,
  listTree,
  openDatabase,
  reorderNotes,
  searchMemory,
  updateNote,
  updateProject
} from '../../src/main/db.ts'

let userData = ''

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'notes-db-'))
})

afterEach(() => {
  closeDatabase()
  rmSync(userData, { recursive: true, force: true })
})

describe('migração de banco antigo', () => {
  it('adiciona position em notes e inline em attachments preservando a ordem por data', () => {
    // schema da versão 1.0.0: sem notes.position, sem attachments.inline
    const legacy = new DatabaseSync(join(userData, 'notes.db'))
    legacy.exec(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body_json TEXT NOT NULL DEFAULT '{}',
        body_text TEXT NOT NULL DEFAULT '',
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        mime TEXT NOT NULL DEFAULT '',
        size INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      INSERT INTO projects (id, name, position, created_at, updated_at)
        VALUES (1, 'Antigo', 0, '2025-01-01', '2025-01-01');
      INSERT INTO notes (id, project_id, title, created_at, updated_at) VALUES
        (10, 1, 'mais antiga', '2025-01-01', '2025-01-01T10:00:00Z'),
        (11, 1, 'do meio',     '2025-01-01', '2025-01-02T10:00:00Z'),
        (12, 1, 'mais nova',   '2025-01-01', '2025-01-03T10:00:00Z');
      INSERT INTO attachments (project_id, note_id, filename, stored_name, created_at)
        VALUES (1, 10, 'a.txt', 'x.txt', '2025-01-01');
    `)
    legacy.close()

    openDatabase(userData)

    const tree = listTree()
    assert.equal(tree.length, 1)
    assert.deepEqual(
      tree[0].notes.map((note) => note.title),
      ['mais nova', 'do meio', 'mais antiga'],
      'ordem antiga (mais recente primeiro) vira position 0,1,2'
    )
    assert.deepEqual(
      tree[0].notes.map((note) => note.position),
      [0, 1, 2]
    )

    const inline = getDb().prepare('SELECT inline FROM attachments').all()
    assert.deepEqual(
      inline.map((row) => row.inline),
      [0]
    )
  })

  it('abrir duas vezes o mesmo banco é idempotente', () => {
    openDatabase(userData)
    createProject('P')
    closeDatabase()
    openDatabase(userData)
    assert.equal(listTree().length, 1)
  })
})

describe('ordem de notas', () => {
  beforeEach(() => openDatabase(userData))

  it('nova nota entra no topo e as demais descem', () => {
    const project = createProject('P')
    const a = createNote(project.id, 'A')
    const b = createNote(project.id, 'B')
    const c = createNote(project.id, 'C')
    assert.deepEqual(
      listTree()[0].notes.map((note) => note.id),
      [c.id, b.id, a.id]
    )
    assert.equal(getNote(c.id).position, 0)
    assert.equal(getNote(a.id).position, 2)
  })

  it('reorderNotes aplica a ordem, ignora ids alheios e joga omitidas para o fim', () => {
    const p1 = createProject('P1')
    const p2 = createProject('P2')
    const a = createNote(p1.id, 'A')
    const b = createNote(p1.id, 'B')
    const c = createNote(p1.id, 'C')
    const other = createNote(p2.id, 'X')

    reorderNotes(p1.id, [a.id, other.id, c.id, 999])
    const p1Tree = listTree().find((item) => item.id === p1.id)
    assert.deepEqual(
      p1Tree.notes.map((note) => note.id),
      [a.id, c.id, b.id]
    )
    // a nota do outro projeto não mudou de projeto nem de posição
    assert.equal(getNote(other.id).projectId, p2.id)
    assert.equal(getNote(other.id).position, 0)
  })

  it('a ordem independe de updated_at depois de reordenar', () => {
    const project = createProject('P')
    const a = createNote(project.id, 'A')
    const b = createNote(project.id, 'B')
    reorderNotes(project.id, [a.id, b.id])
    updateNote(b.id, { title: 'B editada agora' })
    assert.deepEqual(
      listTree()[0].notes.map((note) => note.id),
      [a.id, b.id]
    )
  })
})

describe('leituras e updates', () => {
  beforeEach(() => openDatabase(userData))

  it('get de item inexistente devolve null em vez de lançar', () => {
    assert.equal(getNote(12345), null)
    assert.equal(getProject(12345), null)
    assert.equal(updateNote(12345, { title: 'x' }), null)
    assert.equal(updateProject(12345, { name: 'x' }), null)
  })

  it('renomear projeto para vazio mantém o nome anterior', () => {
    const project = createProject('Nome')
    const updated = updateProject(project.id, { name: '   ' })
    assert.equal(updated.name, 'Nome')
  })

  it('updateNote com o mesmo corpo não reindexa tarefas nem muda o texto', () => {
    const project = createProject('P')
    const note = createNote(project.id, 'N')
    const body = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'fazer' }] }]
            }
          ]
        }
      ]
    })
    updateNote(note.id, { bodyJson: body })
    const before = getDb().prepare('SELECT id FROM tasks WHERE note_id = ?').all(note.id)
    updateNote(note.id, { bodyJson: body })
    const after = getDb().prepare('SELECT id FROM tasks WHERE note_id = ?').all(note.id)
    assert.deepEqual(after, before, 'ids das tarefas preservados quando o corpo não mudou')
    assert.equal(getNote(note.id).bodyText, 'fazer')
  })

  it('body vazio (string vazia) ainda é tratado como mudança de corpo', () => {
    const project = createProject('P')
    const note = createNote(project.id, 'N')
    updateNote(note.id, {
      bodyJson: JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'texto' }] }]
      })
    })
    assert.equal(getNote(note.id).bodyText, 'texto')
    const cleared = updateNote(note.id, { bodyJson: '' })
    assert.equal(cleared.bodyText, '')
  })
})

describe('busca', () => {
  beforeEach(() => openDatabase(userData))

  it('acha por prefixo da última palavra enquanto digita', () => {
    const project = createProject('Reforma do consultório')
    const note = createNote(project.id, 'Orçamentos da clínica')
    updateNote(note.id, {
      bodyJson: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Pedir orçamento da marmoraria' }] }
        ]
      })
    })
    assert.ok(searchMemory('orç').some((hit) => hit.kind === 'note'))
    assert.ok(searchMemory('marmor').some((hit) => hit.kind === 'note'))
    assert.ok(searchMemory('reforma consult').some((hit) => hit.kind === 'project'))
    assert.equal(searchMemory('   ').length, 0)
    assert.equal(searchMemory('"*(').length, 0, 'pontuação sozinha não quebra a query FTS')
  })

  it('apagar nota e projeto limpa o índice', () => {
    const project = createProject('Projeto X')
    const note = createNote(project.id, 'Nota Y')
    assert.ok(searchMemory('Nota Y').length > 0)
    deleteNote(note.id)
    assert.equal(searchMemory('Nota Y').length, 0)
    deleteProject(project.id)
    assert.equal(searchMemory('Projeto X').length, 0)
  })
})
