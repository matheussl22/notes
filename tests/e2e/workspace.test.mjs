/**
 * Estado puro do split view (src/renderer/src/workspace.ts): sem DOM, sem React.
 * Cobre todas as funções e as bordas que já deram problema.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_RATIO,
  MAX_PANES,
  MAX_RATIO,
  MIN_RATIO,
  NONE,
  activeSelection,
  clampRatio,
  closeOther,
  closePane,
  dropDeleted,
  initialWorkspace,
  moveAside,
  openInPane,
  openInSplit,
  paneIndexShowing,
  parseNoteTransfer,
  parseRatio,
  parseWorkspace,
  projectIdForNewNote,
  pruneAgainstTree,
  sameSelection,
  selectInActive,
  serializeWorkspace,
  setActive,
  splitActive,
  swapPanes
} from '../../src/renderer/src/workspace.ts'
import { fileKind } from '../../src/renderer/src/components/file-kind.ts'

const note = (projectId, noteId) => ({ kind: 'note', projectId, noteId })
const project = (projectId) => ({ kind: 'project', projectId })

const tree = [
  { id: 1, notes: [{ id: 10 }, { id: 11 }] },
  { id: 2, notes: [{ id: 20 }] }
]

describe('sameSelection / activeSelection / paneIndexShowing', () => {
  it('compara por tipo e id', () => {
    assert.equal(sameSelection(NONE, NONE), true)
    assert.equal(sameSelection(project(1), project(1)), true)
    assert.equal(sameSelection(project(1), project(2)), false)
    assert.equal(sameSelection(note(1, 10), note(1, 10)), true)
    assert.equal(sameSelection(note(1, 10), note(1, 11)), false)
    assert.equal(sameSelection(note(1, 10), project(1)), false)
    assert.equal(sameSelection(NONE, project(1)), false)
  })

  it('activeSelection cai em NONE se o índice estiver fora', () => {
    assert.deepEqual(activeSelection(initialWorkspace), NONE)
    assert.deepEqual(activeSelection({ panes: [project(1)], active: 5 }), NONE)
    assert.deepEqual(activeSelection({ panes: [project(1), note(1, 10)], active: 1 }), note(1, 10))
  })

  it('paneIndexShowing nunca casa NONE (dois painéis vazios não são "a mesma coisa")', () => {
    const ws = { panes: [NONE, note(1, 10)], active: 0 }
    assert.equal(paneIndexShowing(ws, NONE), -1)
    assert.equal(paneIndexShowing(ws, note(1, 10)), 1)
    assert.equal(paneIndexShowing(ws, note(1, 11)), -1)
  })
})

describe('selectInActive', () => {
  it('substitui o painel ativo', () => {
    const ws = selectInActive(initialWorkspace, note(1, 10))
    assert.deepEqual(ws, { panes: [note(1, 10)], active: 0 })
  })

  it('só ativa o outro painel se a nota já estiver aberta nele', () => {
    const ws = { panes: [project(1), note(1, 10)], active: 0 }
    const next = selectInActive(ws, note(1, 10))
    assert.deepEqual(next.panes, ws.panes)
    assert.equal(next.active, 1)
  })

  it('o mesmo projeto pode ficar aberto nos dois painéis', () => {
    const ws = { panes: [project(1), note(1, 10)], active: 1 }
    const next = selectInActive(ws, project(1))
    // já estava no painel 0: apenas ativa
    assert.equal(next.active, 0)
    assert.deepEqual(next.panes, ws.panes)
  })

  it('não muta o estado original', () => {
    const ws = { panes: [NONE], active: 0 }
    selectInActive(ws, project(1))
    assert.deepEqual(ws, { panes: [NONE], active: 0 })
  })
})

describe('openInSplit', () => {
  it('abre um segundo painel e o ativa', () => {
    const ws = openInSplit({ panes: [note(1, 10)], active: 0 }, note(1, 11))
    assert.deepEqual(ws, { panes: [note(1, 10), note(1, 11)], active: 1 })
  })

  it('com nota já aberta no outro painel apenas ativa aquele painel', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 1 }
    const next = openInSplit(ws, note(1, 10))
    assert.deepEqual(next.panes, ws.panes)
    assert.equal(next.active, 0)
  })

  it('com dois painéis substitui o inativo', () => {
    const ws = { panes: [note(1, 10), note(1, 11)], active: 0 }
    const next = openInSplit(ws, note(2, 20))
    assert.deepEqual(next, { panes: [note(1, 10), note(2, 20)], active: 1 })

    const fromRight = openInSplit({ ...ws, active: 1 }, note(2, 20))
    assert.deepEqual(fromRight, { panes: [note(2, 20), note(1, 11)], active: 0 })
  })

  it('nunca passa de MAX_PANES', () => {
    let ws = initialWorkspace
    for (let i = 1; i <= 5; i++) ws = openInSplit(ws, project(i))
    assert.equal(ws.panes.length, MAX_PANES)
  })
})

describe('openInPane', () => {
  it('abre no painel pedido e o ativa', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 0 }
    assert.deepEqual(openInPane(ws, 1, note(1, 11)), {
      panes: [note(1, 10), note(1, 11)],
      active: 1
    })
  })

  it('respeita a regra de nota única: ativa o painel que já a mostra', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 1 }
    assert.deepEqual(openInPane(ws, 1, note(1, 10)), { ...ws, active: 0 })
  })

  it('ignora índice fora do intervalo', () => {
    const ws = { panes: [note(1, 10)], active: 0 }
    assert.equal(openInPane(ws, 1, project(2)), ws)
    assert.equal(openInPane(ws, -1, project(2)), ws)
  })
})

describe('moveAside', () => {
  it('com um painel, a nota vai para a direita e o projeto fica à esquerda', () => {
    assert.deepEqual(moveAside({ panes: [note(1, 10)], active: 0 }, 0), {
      panes: [project(1), note(1, 10)],
      active: 1
    })
    assert.deepEqual(moveAside({ panes: [project(1)], active: 0 }, 0), {
      panes: [NONE, project(1)],
      active: 1
    })
  })

  it('com dois painéis, troca para o outro lado e deixa o projeto no lugar', () => {
    const ws = { panes: [note(1, 10), note(2, 20)], active: 0 }
    assert.deepEqual(moveAside(ws, 0), { panes: [project(1), note(1, 10)], active: 1 })
    assert.deepEqual(moveAside(ws, 1), { panes: [note(2, 20), project(2)], active: 0 })
  })

  it('painel vazio ou índice inválido: neutro', () => {
    const ws = { panes: [NONE, note(2, 20)], active: 0 }
    assert.equal(moveAside(ws, 0), ws)
    assert.equal(moveAside(ws, 5), ws)
  })
})

describe('splitActive', () => {
  it('a partir de uma nota, abre o projeto dela ao lado', () => {
    const ws = splitActive({ panes: [note(1, 10)], active: 0 })
    assert.deepEqual(ws, { panes: [note(1, 10), project(1)], active: 1 })
  })

  it('a partir de um projeto ou do vazio, abre um painel vazio', () => {
    assert.deepEqual(splitActive({ panes: [project(1)], active: 0 }), {
      panes: [project(1), NONE],
      active: 1
    })
    assert.deepEqual(splitActive(initialWorkspace), { panes: [NONE, NONE], active: 1 })
  })

  it('não faz nada com dois painéis', () => {
    const ws = { panes: [note(1, 10), project(1)], active: 0 }
    assert.equal(splitActive(ws), ws)
  })
})

describe('closePane / closeOther', () => {
  it('fechar o único painel deixa um painel vazio', () => {
    assert.deepEqual(closePane({ panes: [note(1, 10)], active: 0 }, 0), initialWorkspace)
  })

  it('fechar o ativo passa o foco para o que sobrou', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 1 }
    assert.deepEqual(closePane(ws, 1), { panes: [note(1, 10)], active: 0 })
  })

  it('fechar o painel antes do ativo corrige o índice', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 1 }
    assert.deepEqual(closePane(ws, 0), { panes: [project(2)], active: 0 })
  })

  it('fechar o inativo mantém o ativo', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 0 }
    assert.deepEqual(closePane(ws, 1), { panes: [note(1, 10)], active: 0 })
  })

  it('índice inválido não altera nada', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 0 }
    assert.equal(closePane(ws, 2), ws)
    assert.equal(closePane(ws, -1), ws)
  })

  it('closeOther fecha o inativo; com um painel é neutro', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 1 }
    assert.deepEqual(closeOther(ws), { panes: [project(2)], active: 0 })
    const single = { panes: [note(1, 10)], active: 0 }
    assert.equal(closeOther(single), single)
  })
})

describe('setActive / swapPanes', () => {
  it('setActive valida o índice e devolve a mesma referência quando nada muda', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 0 }
    assert.equal(setActive(ws, 0), ws)
    assert.equal(setActive(ws, 2), ws)
    assert.equal(setActive(ws, -1), ws)
    assert.deepEqual(setActive(ws, 1), { ...ws, active: 1 })
  })

  it('swapPanes troca os lados e acompanha o ativo', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 0 }
    assert.deepEqual(swapPanes(ws), { panes: [project(2), note(1, 10)], active: 1 })
    assert.deepEqual(swapPanes(swapPanes(ws)), ws)
  })

  it('swapPanes com um painel é neutro', () => {
    const ws = { panes: [note(1, 10)], active: 0 }
    assert.equal(swapPanes(ws), ws)
  })
})

describe('dropDeleted', () => {
  it('nota apagada volta para o projeto dela', () => {
    const ws = { panes: [note(1, 10), note(1, 11)], active: 0 }
    assert.deepEqual(dropDeleted(ws, { noteId: 10 }), {
      panes: [project(1), note(1, 11)],
      active: 0
    })
  })

  it('projeto apagado limpa todos os painéis que o mostravam, inclusive o ativo', () => {
    const ws = { panes: [note(1, 10), project(1)], active: 0 }
    assert.deepEqual(dropDeleted(ws, { projectId: 1 }), { panes: [NONE, NONE], active: 0 })
  })

  it('dois painéis com o mesmo projeto: apagar limpa os dois', () => {
    const ws = { panes: [project(1), project(1)], active: 1 }
    assert.deepEqual(dropDeleted(ws, { projectId: 1 }), { panes: [NONE, NONE], active: 1 })
  })

  it('não toca no que não foi apagado', () => {
    const ws = { panes: [note(2, 20), project(1)], active: 1 }
    assert.deepEqual(dropDeleted(ws, { noteId: 10 }), ws)
    assert.deepEqual(dropDeleted(ws, {}), ws)
  })
})

describe('pruneAgainstTree', () => {
  it('mantém o que existe', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 1 }
    assert.deepEqual(pruneAgainstTree(ws, tree), ws)
  })

  it('nota sumida vira o projeto; projeto sumido vira vazio', () => {
    const ws = { panes: [note(1, 99), note(9, 90)], active: 1 }
    assert.deepEqual(pruneAgainstTree(ws, tree), { panes: [project(1), NONE], active: 1 })
  })

  it('árvore vazia esvazia os painéis mas preserva a quantidade', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 1 }
    assert.deepEqual(pruneAgainstTree(ws, []), { panes: [NONE, NONE], active: 1 })
  })

  it('corrige um índice ativo fora do intervalo', () => {
    const ws = { panes: [project(1)], active: 3 }
    assert.deepEqual(pruneAgainstTree(ws, tree), { panes: [project(1)], active: 0 })
  })
})

describe('serializeWorkspace / parseWorkspace', () => {
  it('ida e volta preserva o estado', () => {
    const ws = { panes: [note(1, 10), project(2)], active: 1 }
    assert.deepEqual(parseWorkspace(serializeWorkspace(ws)), ws)
    assert.deepEqual(parseWorkspace(serializeWorkspace(initialWorkspace)), initialWorkspace)
  })

  it('aceita ids inexistentes (quem resolve é pruneAgainstTree)', () => {
    const ws = parseWorkspace(serializeWorkspace({ panes: [note(7, 70)], active: 0 }))
    assert.deepEqual(pruneAgainstTree(ws, tree), initialWorkspace)
  })

  it('rejeita lixo', () => {
    assert.equal(parseWorkspace(null), null)
    assert.equal(parseWorkspace(undefined), null)
    assert.equal(parseWorkspace(''), null)
    assert.equal(parseWorkspace('{'), null)
    assert.equal(parseWorkspace('42'), null)
    assert.equal(parseWorkspace('{"panes":[]}'), null)
    assert.equal(parseWorkspace('{"panes":[{"kind":"x"}],"active":0}'), null)
    assert.equal(parseWorkspace('{"panes":[{"kind":"note","projectId":1}],"active":0}'), null)
    assert.equal(parseWorkspace('{"panes":[{"kind":"project","projectId":"1"}]}'), null)
    assert.equal(parseWorkspace('{"panes":[{"kind":"project","projectId":0}]}'), null)
  })

  it('rejeita três painéis e a mesma nota nos dois lados', () => {
    const three = JSON.stringify({ panes: [NONE, NONE, NONE], active: 0 })
    assert.equal(parseWorkspace(three), null)
    const twin = JSON.stringify({ panes: [note(1, 10), note(1, 10)], active: 0 })
    assert.equal(parseWorkspace(twin), null)
  })

  it('normaliza o índice ativo', () => {
    const raw = JSON.stringify({ panes: [project(1), project(2)], active: 9 })
    assert.equal(parseWorkspace(raw).active, 1)
    const negative = JSON.stringify({ panes: [project(1)], active: -2 })
    assert.equal(parseWorkspace(negative).active, 0)
    const missing = JSON.stringify({ panes: [project(1)] })
    assert.equal(parseWorkspace(missing).active, 0)
  })
})

describe('parseNoteTransfer / projectIdForNewNote', () => {
  it('lê o payload text/note da sidebar', () => {
    assert.deepEqual(parseNoteTransfer('{"projectId":1,"noteId":10}'), note(1, 10))
    assert.equal(parseNoteTransfer('{"projectId":1}'), null)
    assert.equal(parseNoteTransfer('{"projectId":"1","noteId":10}'), null)
    assert.equal(parseNoteTransfer('nope'), null)
    assert.equal(parseNoteTransfer(''), null)
    assert.equal(parseNoteTransfer(null), null)
  })

  it('escolhe o projeto do painel ativo, depois do outro, depois o primeiro da árvore', () => {
    assert.equal(projectIdForNewNote({ panes: [note(2, 20), project(1)], active: 0 }, tree), 2)
    assert.equal(projectIdForNewNote({ panes: [NONE, project(1)], active: 0 }, tree), 1)
    assert.equal(projectIdForNewNote({ panes: [NONE], active: 0 }, tree), 1)
    assert.equal(projectIdForNewNote({ panes: [NONE], active: 0 }, []), null)
  })
})

describe('clampRatio / parseRatio', () => {
  it('limita entre MIN_RATIO e MAX_RATIO', () => {
    assert.equal(clampRatio(0.1), MIN_RATIO)
    assert.equal(clampRatio(0.9), MAX_RATIO)
    assert.equal(clampRatio(0.4), 0.4)
    assert.equal(clampRatio(NaN), DEFAULT_RATIO)
    assert.equal(clampRatio(Infinity), DEFAULT_RATIO)
  })

  it('parseRatio lê o localStorage com tolerância', () => {
    assert.equal(parseRatio(null), DEFAULT_RATIO)
    assert.equal(parseRatio(''), DEFAULT_RATIO)
    assert.equal(parseRatio('abc'), DEFAULT_RATIO)
    assert.equal(parseRatio('0.3'), 0.3)
    assert.equal(parseRatio('2'), MAX_RATIO)
  })
})

describe('fileKind (ícone dos anexos)', () => {
  it('prefere o mime; cai na extensão quando ele falta', () => {
    assert.equal(fileKind('foto.bin', 'image/png'), 'image')
    assert.equal(fileKind('contrato', 'application/pdf'), 'pdf')
    assert.equal(fileKind('planilha.xlsx', ''), 'sheet')
    assert.equal(fileKind('dados.csv', 'text/csv'), 'sheet')
    assert.equal(fileKind('README.MD', ''), 'text')
    assert.equal(fileKind('notas', 'text/plain'), 'text')
    assert.equal(fileKind('FOTO.JPG', 'application/octet-stream'), 'image')
    assert.equal(fileKind('arquivo.zip', 'application/zip'), 'other')
    assert.equal(fileKind('semextensao', ''), 'other')
  })
})
