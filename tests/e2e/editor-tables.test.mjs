/**
 * Tabelas no editor headless (jsdom): inserção, comandos de linha/coluna,
 * cabeçalho, imagem em célula, Enter na última célula e colagem de HTML.
 */
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { Editor } from '@tiptap/core'
import { ensureDom } from './dom.mjs'
import { notesEditorExtensions, TABLE_DEFAULTS } from '../../src/renderer/src/editor/setup.ts'

let editor = null

function createEditor(content = '<p></p>') {
  ensureDom()
  const root = document.createElement('div')
  document.body.appendChild(root)
  return new Editor({ element: root, extensions: notesEditorExtensions(), content })
}

/** primeira tabela do documento, ou null */
function findTable(json) {
  return json.content.find((node) => node.type === 'table') ?? null
}

function rowTypes(table) {
  return table.content.map((row) => row.content.map((cell) => cell.type))
}

/** posição do início do conteúdo da célula (linha, coluna) */
function cellPos(doc, row, col) {
  let found = null
  doc.descendants((node, pos) => {
    if (found !== null || node.type.name !== 'table') return
    const rowNode = node.child(row)
    let offset = pos + 1
    for (let r = 0; r < row; r += 1) offset += node.child(r).nodeSize
    let cellOffset = offset + 1
    for (let c = 0; c < col; c += 1) cellOffset += rowNode.child(c).nodeSize
    // +1 entra na célula, +1 entra no primeiro parágrafo dela
    found = cellOffset + 2
  })
  return found
}

describe('editor: tabelas', () => {
  beforeEach(() => {
    editor = createEditor()
  })

  afterEach(() => {
    editor?.destroy()
    editor = null
  })

  it('insere uma tabela 3×3 com linha de cabeçalho', () => {
    assert.ok(editor.commands.insertTable(TABLE_DEFAULTS))
    const table = findTable(editor.getJSON())
    assert.ok(table, 'tabela presente')
    const types = rowTypes(table)
    assert.equal(types.length, 3)
    assert.deepEqual(types[0], ['tableHeader', 'tableHeader', 'tableHeader'])
    assert.deepEqual(types[1], ['tableCell', 'tableCell', 'tableCell'])
    assert.deepEqual(types[2], ['tableCell', 'tableCell', 'tableCell'])
    // trailingNode garante um parágrafo depois da tabela
    const last = editor.getJSON().content.at(-1)
    assert.equal(last.type, 'paragraph')
  })

  it('adiciona e remove linhas e colunas, alterna cabeçalho e exclui a tabela', () => {
    editor.commands.insertTable(TABLE_DEFAULTS)
    // cursor cai na primeira célula; adiciona linha abaixo e coluna à esquerda
    assert.ok(editor.commands.addRowAfter())
    let table = findTable(editor.getJSON())
    assert.equal(table.content.length, 4)

    assert.ok(editor.commands.addColumnBefore())
    table = findTable(editor.getJSON())
    assert.equal(table.content[0].content.length, 4)
    assert.equal(table.content[0].content[0].type, 'tableHeader')

    assert.ok(editor.commands.deleteColumn())
    table = findTable(editor.getJSON())
    assert.equal(table.content[0].content.length, 3)

    // o cursor está na linha de cabeçalho: excluir a linha remove o cabeçalho
    assert.ok(editor.commands.deleteRow())
    table = findTable(editor.getJSON())
    assert.equal(table.content.length, 3)
    assert.deepEqual(rowTypes(table)[0], ['tableCell', 'tableCell', 'tableCell'])

    // alternar cabeçalho recria a linha de cabeçalho e depois a desfaz
    assert.ok(editor.commands.toggleHeaderRow())
    table = findTable(editor.getJSON())
    assert.deepEqual(rowTypes(table)[0], ['tableHeader', 'tableHeader', 'tableHeader'])
    assert.ok(editor.commands.toggleHeaderRow())
    table = findTable(editor.getJSON())
    assert.deepEqual(rowTypes(table)[0], ['tableCell', 'tableCell', 'tableCell'])

    assert.ok(editor.commands.deleteTable())
    assert.equal(findTable(editor.getJSON()), null)
    assert.equal(editor.isActive('table'), false)
  })

  it('aceita imagem dentro de célula e mantém os atributos', () => {
    editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: false })
    const pos = cellPos(editor.state.doc, 1, 1)
    assert.ok(pos > 0)
    editor.commands.insertContentAt(pos, {
      type: 'image',
      attrs: { src: 'notes-file://attachment/7', alt: 'planta.png', width: 240, align: 'center' }
    })
    const table = findTable(editor.getJSON())
    const cell = table.content[1].content[1]
    const image = cell.content.find((node) => node.type === 'image')
    assert.ok(image, 'imagem dentro da célula')
    assert.equal(image.attrs.src, 'notes-file://attachment/7')
    assert.equal(image.attrs.alt, 'planta.png')
    assert.equal(image.attrs.width, 240)
    assert.equal(image.attrs.align, 'center')
    assert.doesNotThrow(() => editor.state.doc.check())
  })

  it('Enter na última célula cria parágrafo dentro da célula sem quebrar o documento', () => {
    editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true })
    const pos = cellPos(editor.state.doc, 1, 1)
    editor.commands.setTextSelection(pos)
    editor.commands.insertContent('fim')
    assert.ok(editor.commands.splitBlock())
    editor.commands.insertContent('nova linha')
    const table = findTable(editor.getJSON())
    const lastCell = table.content[1].content[1]
    assert.equal(lastCell.content.length, 2)
    assert.equal(lastCell.content[1].content[0].text, 'nova linha')
    assert.doesNotThrow(() => editor.state.doc.check())
    assert.equal(editor.getJSON().content.at(-1).type, 'paragraph')
  })

  it('Tab navega para a próxima célula', () => {
    editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true })
    const first = editor.state.selection.from
    assert.ok(editor.commands.goToNextCell())
    assert.ok(editor.state.selection.from > first)
  })

  it('HTML colado com <table> vira tabela (Excel/Confluence)', () => {
    const html =
      '<table><tbody><tr><th>Fornecedor</th><th>Valor</th></tr>' +
      '<tr><td>Marmoraria</td><td>R$ 8.400,00</td></tr></tbody></table>'
    editor.commands.insertContent(html)
    const table = findTable(editor.getJSON())
    assert.ok(table, 'tabela criada a partir do HTML')
    assert.deepEqual(rowTypes(table), [
      ['tableHeader', 'tableHeader'],
      ['tableCell', 'tableCell']
    ])
    assert.equal(table.content[1].content[1].content[0].content[0].text, 'R$ 8.400,00')
  })

  it('atalho Ctrl+Alt+T está registrado como comando de tabela', () => {
    const shortcut = editor.extensionManager.extensions.find((ext) => ext.name === 'tableShortcut')
    assert.ok(shortcut, 'extensão tableShortcut presente')
  })
})
