/**
 * Menu "/": filtro puro e execução dos comandos no editor headless.
 */
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { Editor } from '@tiptap/core'
import { ensureDom } from './dom.mjs'
import { notesEditorExtensions } from '../../src/renderer/src/editor/setup.ts'
import {
  filterSlashCommands,
  formatToday,
  normalizeQuery,
  runSlashCommand,
  slashCommands
} from '../../src/renderer/src/editor/slash-commands.ts'

describe('slash-commands: filtro (puro)', () => {
  it('query vazia devolve todos os comandos', () => {
    const all = filterSlashCommands('')
    assert.equal(all.length, slashCommands().length)
    assert.equal(all.length, 12)
  })

  it('"tab" acha Tabela', () => {
    const [first] = filterSlashCommands('tab')
    assert.equal(first.id, 'table')
    assert.equal(first.label, 'Tabela')
  })

  it('"check" acha Checklist', () => {
    const ids = filterSlashCommands('check').map((item) => item.id)
    assert.ok(ids.includes('task'))
  })

  it('busca sem acento acha "Título"', () => {
    const ids = filterSlashCommands('titulo').map((item) => item.id)
    assert.deepEqual(ids.slice(0, 3).sort(), ['heading1', 'heading2', 'heading3'])
    assert.equal(normalizeQuery('Título'), 'titulo')
  })

  it('aceita termos em inglês e espanhol, mas rotula no idioma pedido', () => {
    const [table] = filterSlashCommands('table', 'es')
    assert.equal(table.label, 'Tabla')
    const [image] = filterSlashCommands('imagen', 'en')
    assert.equal(image.label, 'Image')
  })

  it('não acha nada para lixo', () => {
    assert.deepEqual(filterSlashCommands('zzzz'), [])
  })

  it('formata a data de hoje conforme o idioma', () => {
    const date = new Date(2026, 8, 4)
    assert.equal(formatToday('pt', date), '04/09/2026')
    assert.equal(formatToday('es', date), '04/09/2026')
    assert.equal(formatToday('en', date), '09/04/2026')
  })
})

describe('slash-commands: execução no editor', () => {
  let editor = null

  beforeEach(() => {
    ensureDom()
    // `focus()` do Tiptap agenda via requestAnimationFrame, que o jsdom não expõe
    globalThis.requestAnimationFrame ??= (callback) => setTimeout(() => callback(Date.now()), 0)
    const root = document.createElement('div')
    document.body.appendChild(root)
    editor = new Editor({ element: root, extensions: notesEditorExtensions(), content: '<p></p>' })
  })

  afterEach(() => {
    editor?.destroy()
    editor = null
  })

  const context = { locale: 'pt', pickImage: () => {} }

  it('"/tab" + Tabela apaga o texto e insere a tabela 3×3', () => {
    editor.commands.setContent('<p>/tab</p>')
    runSlashCommand(editor, { from: 1, to: 5 }, { id: 'table' }, context)
    const json = editor.getJSON()
    const table = json.content.find((node) => node.type === 'table')
    assert.ok(table)
    assert.equal(table.content.length, 3)
    assert.equal(table.content[0].content[0].type, 'tableHeader')
    assert.ok(!editor.getText().includes('/tab'))
  })

  it('Título 1 transforma o parágrafo', () => {
    editor.commands.setContent('<p>/h1</p>')
    runSlashCommand(editor, { from: 1, to: 4 }, { id: 'heading1' }, context)
    assert.equal(editor.getJSON().content[0].type, 'heading')
    assert.equal(editor.getJSON().content[0].attrs.level, 1)
  })

  it('Checklist, citação, código e divisor', () => {
    editor.commands.setContent('<p>/x</p>')
    runSlashCommand(editor, { from: 1, to: 3 }, { id: 'task' }, context)
    assert.equal(editor.getJSON().content[0].type, 'taskList')

    editor.commands.setContent('<p>/x</p>')
    runSlashCommand(editor, { from: 1, to: 3 }, { id: 'quote' }, context)
    assert.equal(editor.getJSON().content[0].type, 'blockquote')

    editor.commands.setContent('<p>/x</p>')
    runSlashCommand(editor, { from: 1, to: 3 }, { id: 'code' }, context)
    assert.equal(editor.getJSON().content[0].type, 'codeBlock')

    editor.commands.setContent('<p>/x</p>')
    runSlashCommand(editor, { from: 1, to: 3 }, { id: 'divider' }, context)
    assert.ok(editor.getJSON().content.some((node) => node.type === 'horizontalRule'))
  })

  it('Data de hoje insere texto no formato do idioma', () => {
    editor.commands.setContent('<p>/data</p>')
    runSlashCommand(
      editor,
      { from: 1, to: 6 },
      { id: 'date' },
      { ...context, now: () => new Date(2026, 8, 4) }
    )
    assert.equal(editor.getText(), '04/09/2026')
  })

  it('Imagem apaga o texto e delega ao seletor', () => {
    let called = 0
    editor.commands.setContent('<p>/img</p>')
    runSlashCommand(
      editor,
      { from: 1, to: 5 },
      { id: 'image' },
      {
        ...context,
        pickImage: (target) => {
          assert.equal(target, editor)
          called += 1
        }
      }
    )
    assert.equal(called, 1)
    assert.equal(editor.getText(), '')
  })
})
