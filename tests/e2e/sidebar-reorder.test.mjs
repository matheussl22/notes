/**
 * Lógica pura de reordenação e de linhas da barra lateral (sem React, sem DOM).
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  dropPlaceFromPointer,
  insertionIndex,
  moveAdjacent,
  moveItem,
  sameOrder
} from '../../src/renderer/src/components/sidebar/reorder.ts'
import {
  archivedKey,
  noteKey,
  parseKey,
  projectKey,
  rowList,
  showsArchivedToggle,
  visibleNotes
} from '../../src/renderer/src/components/sidebar/model.ts'
import {
  clampWidth,
  DEFAULT_WIDTH,
  MAX_WIDTH,
  MIN_WIDTH
} from '../../src/renderer/src/components/sidebar/storage.ts'

describe('dropPlaceFromPointer', () => {
  const rect = { top: 100, height: 24 }

  it('metade de cima → before, metade de baixo → after', () => {
    assert.equal(dropPlaceFromPointer(rect, 100), 'before')
    assert.equal(dropPlaceFromPointer(rect, 111), 'before')
    assert.equal(dropPlaceFromPointer(rect, 113), 'after')
    assert.equal(dropPlaceFromPointer(rect, 123), 'after')
  })

  it('o meio exato conta como after', () => {
    assert.equal(dropPlaceFromPointer(rect, 112), 'after')
  })
})

describe('insertionIndex', () => {
  const ids = [10, 20, 30]

  it('before devolve o índice do alvo, after o seguinte', () => {
    assert.equal(insertionIndex(ids, 10, 'before'), 0)
    assert.equal(insertionIndex(ids, 10, 'after'), 1)
    assert.equal(insertionIndex(ids, 30, 'after'), 3)
  })

  it('alvo desconhecido → -1', () => {
    assert.equal(insertionIndex(ids, 99, 'before'), -1)
  })
})

describe('moveItem', () => {
  const ids = [1, 2, 3, 4]

  it('move para cima (antes de um item anterior)', () => {
    assert.deepEqual(moveItem(ids, 4, 1, 'before'), [4, 1, 2, 3])
    assert.deepEqual(moveItem(ids, 3, 1, 'after'), [1, 3, 2, 4])
  })

  it('move para baixo (depois de um item posterior)', () => {
    assert.deepEqual(moveItem(ids, 1, 4, 'after'), [2, 3, 4, 1])
    assert.deepEqual(moveItem(ids, 1, 3, 'before'), [2, 1, 3, 4])
    assert.deepEqual(moveItem(ids, 2, 4, 'before'), [1, 3, 2, 4])
  })

  it('soltar na própria posição não altera a ordem', () => {
    assert.deepEqual(moveItem(ids, 2, 3, 'before'), ids)
    assert.deepEqual(moveItem(ids, 2, 1, 'after'), ids)
    assert.deepEqual(moveItem(ids, 2, 2, 'before'), ids)
    assert.deepEqual(moveItem(ids, 2, 2, 'after'), ids)
  })

  it('ids desconhecidos devolvem a ordem original', () => {
    assert.deepEqual(moveItem(ids, 99, 1, 'before'), ids)
    assert.deepEqual(moveItem(ids, 1, 99, 'before'), ids)
  })

  it('nunca altera a lista recebida e sempre devolve uma cópia', () => {
    const input = [1, 2, 3]
    const output = moveItem(input, 3, 1, 'before')
    assert.deepEqual(input, [1, 2, 3])
    assert.notEqual(output, input)
    const untouched = moveItem(input, 1, 1, 'before')
    assert.notEqual(untouched, input)
    assert.deepEqual(untouched, input)
  })

  it('mantém itens não envolvidos (ex.: arquivadas) na posição relativa', () => {
    // 7 é uma nota arquivada escondida: só 1, 2 e 3 estão visíveis
    const full = [1, 7, 2, 3]
    assert.deepEqual(moveItem(full, 3, 1, 'before'), [3, 1, 7, 2])
    assert.deepEqual(moveItem(full, 1, 2, 'after'), [7, 2, 1, 3])
  })
})

describe('moveAdjacent', () => {
  it('sobe e desce uma casa entre os visíveis', () => {
    const ids = [1, 2, 3]
    assert.deepEqual(moveAdjacent(ids, 2, -1), [2, 1, 3])
    assert.deepEqual(moveAdjacent(ids, 2, 1), [1, 3, 2])
  })

  it('nas pontas não muda nada', () => {
    const ids = [1, 2, 3]
    assert.deepEqual(moveAdjacent(ids, 1, -1), ids)
    assert.deepEqual(moveAdjacent(ids, 3, 1), ids)
    assert.deepEqual(moveAdjacent(ids, 99, 1), ids)
  })

  it('pula itens escondidos usando a lista de visíveis', () => {
    const full = [1, 7, 2, 3]
    const visible = [1, 2, 3]
    // 2 sobe: vizinho visível é 1, então passa a ficar antes de 1 (e do 7 escondido)
    assert.deepEqual(moveAdjacent(full, 2, -1, visible), [2, 1, 7, 3])
    // 3 sobe: vizinho visível é 2
    assert.deepEqual(moveAdjacent(full, 3, -1, visible), [1, 7, 3, 2])
    // 1 é o primeiro visível: nada muda
    assert.deepEqual(moveAdjacent(full, 1, -1, visible), full)
  })
})

describe('sameOrder', () => {
  it('compara elemento a elemento', () => {
    assert.equal(sameOrder([1, 2], [1, 2]), true)
    assert.equal(sameOrder([1, 2], [2, 1]), false)
    assert.equal(sameOrder([1], [1, 2]), false)
    assert.equal(sameOrder([], []), true)
  })
})

describe('clampWidth', () => {
  it('limita à faixa e arredonda', () => {
    assert.equal(clampWidth(100), MIN_WIDTH)
    assert.equal(clampWidth(9999), MAX_WIDTH)
    assert.equal(clampWidth(264.6), 265)
    assert.equal(clampWidth('300px'), 300)
    assert.equal(clampWidth('240'), 240)
  })

  it('lixo cai no padrão', () => {
    assert.equal(clampWidth(null), DEFAULT_WIDTH)
    assert.equal(clampWidth(undefined), DEFAULT_WIDTH)
    assert.equal(clampWidth('abc'), DEFAULT_WIDTH)
    assert.equal(clampWidth(NaN), DEFAULT_WIDTH)
  })
})

const note = (id, completed = false) => ({ id, title: `Nota ${id}`, completed, position: 0 })
const project = (id, notes) => ({
  id,
  name: `Projeto ${id}`,
  description: '',
  position: 0,
  createdAt: '',
  updatedAt: '',
  notes
})

describe('visibleNotes', () => {
  const notes = [note(1), note(2, true), note(3)]

  it('esconde arquivadas por padrão e mostra todas quando pedido', () => {
    assert.deepEqual(
      visibleNotes(notes, false, new Set()).map((n) => n.id),
      [1, 3]
    )
    assert.deepEqual(
      visibleNotes(notes, true, new Set()).map((n) => n.id),
      [1, 2, 3]
    )
  })

  it('uma arquivada aberta num painel continua na lista', () => {
    assert.deepEqual(
      visibleNotes(notes, false, new Set([2])).map((n) => n.id),
      [1, 2, 3]
    )
  })
})

describe('rowList', () => {
  const tree = [project(1, [note(11), note(12, true)]), project(2, [note(21)])]
  const base = {
    collapsed: new Set(),
    archivedOpen: new Set(),
    openNoteIds: new Set(),
    activeProjectId: null
  }

  it('lista projeto, notas visíveis e toggle de arquivadas na ordem da tela', () => {
    const keys = rowList(tree, { ...base, activeProjectId: 1 }).map((row) => row.key)
    assert.deepEqual(keys, [projectKey(1), noteKey(11), archivedKey(1), projectKey(2), noteKey(21)])
  })

  it('projeto recolhido só mostra a própria linha', () => {
    const keys = rowList(tree, { ...base, collapsed: new Set([1]), activeProjectId: 1 }).map(
      (row) => row.key
    )
    assert.deepEqual(keys, [projectKey(1), projectKey(2), noteKey(21)])
  })

  it('o toggle só aparece no projeto ativo ou com arquivadas à mostra', () => {
    assert.equal(showsArchivedToggle(tree[0], base), false)
    assert.equal(showsArchivedToggle(tree[0], { ...base, activeProjectId: 1 }), true)
    assert.equal(showsArchivedToggle(tree[0], { ...base, archivedOpen: new Set([1]) }), true)
    assert.equal(showsArchivedToggle(tree[1], { ...base, activeProjectId: 2 }), false)
    const keys = rowList(tree, { ...base, archivedOpen: new Set([1]) }).map((row) => row.key)
    assert.deepEqual(keys, [
      projectKey(1),
      noteKey(11),
      noteKey(12),
      archivedKey(1),
      projectKey(2),
      noteKey(21)
    ])
  })

  it('cada linha conhece o projeto dono', () => {
    const rows = rowList(tree, base)
    assert.deepEqual(
      rows.map((row) => row.projectId),
      [1, 1, 2, 2]
    )
  })
})

describe('parseKey', () => {
  it('reconhece as três chaves e rejeita lixo', () => {
    assert.deepEqual(parseKey(projectKey(4)), { kind: 'project', id: 4 })
    assert.deepEqual(parseKey(noteKey(5)), { kind: 'note', id: 5 })
    assert.deepEqual(parseKey(archivedKey(6)), { kind: 'archived', id: 6 })
    assert.equal(parseKey('x:1'), null)
    assert.equal(parseKey(''), null)
  })
})
