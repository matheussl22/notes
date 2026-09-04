/**
 * Ordem das notas de ponta a ponta: banco SQLite real numa pasta temporária +
 * a mesma função pura (`moveItem`) que a barra lateral usa ao soltar um arrasto.
 */
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  closeDatabase,
  createNote,
  createProject,
  getNote,
  listTree,
  openDatabase,
  reorderNotes
} from '../../src/main/db.ts'
import { moveAdjacent, moveItem } from '../../src/renderer/src/components/sidebar/reorder.ts'

let userData = ''

const idsOf = (projectId) =>
  listTree()
    .find((item) => item.id === projectId)
    .notes.map((n) => n.id)
const positionsOf = (projectId) =>
  listTree()
    .find((item) => item.id === projectId)
    .notes.map((n) => n.position)

describe('ordem das notas (banco + helpers da sidebar)', () => {
  beforeEach(() => {
    userData = mkdtempSync(join(tmpdir(), 'notes-sidebar-order-'))
    openDatabase(userData)
  })

  afterEach(() => {
    closeDatabase()
    rmSync(userData, { recursive: true, force: true })
  })

  it('nova nota entra em position 0 e as demais descem', () => {
    const project = createProject('Projeto')
    const a = createNote(project.id, 'A')
    assert.equal(a.position, 0)
    const b = createNote(project.id, 'B')
    assert.equal(b.position, 0)
    assert.equal(getNote(a.id).position, 1)
    const c = createNote(project.id, 'C')
    assert.equal(c.position, 0)
    assert.equal(getNote(b.id).position, 1)
    assert.equal(getNote(a.id).position, 2)

    assert.deepEqual(idsOf(project.id), [c.id, b.id, a.id])
    assert.deepEqual(positionsOf(project.id), [0, 1, 2])
  })

  it('reorderNotes aplica a ordem completa e listTree devolve nela', () => {
    const project = createProject('Projeto')
    const a = createNote(project.id, 'A')
    const b = createNote(project.id, 'B')
    const c = createNote(project.id, 'C')
    // ordem atual: c, b, a

    reorderNotes(project.id, [a.id, c.id, b.id])
    assert.deepEqual(idsOf(project.id), [a.id, c.id, b.id])
    assert.deepEqual(positionsOf(project.id), [0, 1, 2])
  })

  it('ignora ids de outro projeto ou inexistentes e manda as omitidas para o fim', () => {
    const project = createProject('Projeto')
    const other = createProject('Outro')
    const a = createNote(project.id, 'A')
    const b = createNote(project.id, 'B')
    const c = createNote(project.id, 'C')
    const foreign = createNote(other.id, 'De outro projeto')
    // ordem atual do projeto: c, b, a

    reorderNotes(project.id, [b.id, foreign.id, 9999, b.id])
    // b vai para o topo; c e a (omitidas) vão para o fim mantendo a ordem relativa
    assert.deepEqual(idsOf(project.id), [b.id, c.id, a.id])
    assert.deepEqual(positionsOf(project.id), [0, 1, 2])

    // o outro projeto não foi tocado
    assert.deepEqual(idsOf(other.id), [foreign.id])
    assert.equal(getNote(foreign.id).position, 0)
    assert.equal(getNote(foreign.id).projectId, other.id)
  })

  it('moveItem + reorderNotes reproduzem um arrasto real', () => {
    const project = createProject('Projeto')
    const a = createNote(project.id, 'A')
    const b = createNote(project.id, 'B')
    const c = createNote(project.id, 'C')
    const d = createNote(project.id, 'D')
    // ordem na tela: d, c, b, a

    // arrasta A (última) e solta acima de C (segunda): a linha aparece entre D e C
    const before = idsOf(project.id)
    const afterDrag = moveItem(before, a.id, c.id, 'before')
    assert.deepEqual(afterDrag, [d.id, a.id, c.id, b.id])
    reorderNotes(project.id, afterDrag)
    assert.deepEqual(idsOf(project.id), afterDrag)

    // arrasta D (primeira) e solta abaixo de B: [a, c, b, d]
    const second = moveItem(idsOf(project.id), d.id, b.id, 'after')
    assert.deepEqual(second, [a.id, c.id, b.id, d.id])
    reorderNotes(project.id, second)
    assert.deepEqual(idsOf(project.id), second)
    assert.deepEqual(positionsOf(project.id), [0, 1, 2, 3])
  })

  it('Alt+↑ com arquivada escondida no meio mantém a ordem completa coerente', () => {
    const project = createProject('Projeto')
    const a = createNote(project.id, 'A')
    const arch = createNote(project.id, 'Arquivada')
    const b = createNote(project.id, 'B')
    // ordem: b, arch, a — arch está arquivada e escondida na tela (visíveis: b, a)
    const full = idsOf(project.id)
    assert.deepEqual(full, [b.id, arch.id, a.id])
    const visible = [b.id, a.id]

    const moved = moveAdjacent(full, a.id, -1, visible)
    assert.deepEqual(moved, [a.id, b.id, arch.id])
    reorderNotes(project.id, moved)
    assert.deepEqual(idsOf(project.id), moved)
  })
})
