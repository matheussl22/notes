/**
 * Marcas (link, marca-texto, cor), alinhamento e idempotência do roundtrip
 * getJSON → setContent → getJSON com o documento rico do seed.
 */
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { Editor } from '@tiptap/core'
import { ensureDom } from './dom.mjs'
import { notesEditorExtensions } from '../../src/renderer/src/editor/setup.ts'
import {
  applyLink,
  linkTargetFromSelection,
  normalizeUrl,
  removeLink
} from '../../src/renderer/src/editor/link-target.ts'
import { richDoc } from '../../src/main/seed.ts'

let editor = null

function createEditor(content = '<p></p>') {
  ensureDom()
  const root = document.createElement('div')
  document.body.appendChild(root)
  return new Editor({ element: root, extensions: notesEditorExtensions(), content })
}

function marksOfFirstText(json) {
  return json.content[0].content[0].marks ?? []
}

describe('editor: marcas e roundtrip', () => {
  beforeEach(() => {
    editor = createEditor()
  })

  afterEach(() => {
    editor?.destroy()
    editor = null
  })

  it('setLink / unsetLink', () => {
    editor.commands.setContent('<p>Planta atualizada</p>')
    editor.commands.setTextSelection({ from: 1, to: 7 })
    assert.ok(editor.commands.setLink({ href: 'https://example.com/planta' }))
    const link = marksOfFirstText(editor.getJSON()).find((mark) => mark.type === 'link')
    assert.ok(link)
    assert.equal(link.attrs.href, 'https://example.com/planta')
    assert.equal(link.attrs.target, '_blank')

    assert.ok(editor.commands.unsetLink())
    assert.equal(
      marksOfFirstText(editor.getJSON()).some((mark) => mark.type === 'link'),
      false
    )
  })

  it('popover de link: alvo pela seleção, URL normalizado, aplicar e remover', () => {
    globalThis.requestAnimationFrame ??= (callback) => setTimeout(() => callback(Date.now()), 0)
    assert.equal(normalizeUrl('  example.com/a '), 'https://example.com/a')
    assert.equal(normalizeUrl('http://x.io'), 'http://x.io')
    assert.equal(normalizeUrl('mailto:a@b.c'), 'mailto:a@b.c')
    assert.equal(normalizeUrl('   '), '')

    // com seleção: aplica no trecho
    editor.commands.setContent('<p>Ver planta atualizada</p>')
    editor.commands.setTextSelection({ from: 5, to: 11 })
    let target = linkTargetFromSelection(editor)
    assert.deepEqual(target, { from: 5, to: 11, href: '', hasRange: true })
    applyLink(editor, target, 'example.com')
    assert.match(editor.getHTML(), /<a [^>]*href="https:\/\/example.com"[^>]*>planta<\/a>/)

    // cursor dentro do link, sem seleção: alvo é o link inteiro
    editor.commands.setTextSelection(7)
    target = linkTargetFromSelection(editor)
    assert.deepEqual(target, { from: 5, to: 11, href: 'https://example.com', hasRange: true })
    removeLink(editor, target)
    assert.ok(!editor.getHTML().includes('<a '))

    // sem seleção e sem link: o URL vira texto linkado
    editor.commands.setContent('<p>Site:</p>')
    editor.commands.setTextSelection(6)
    target = linkTargetFromSelection(editor)
    assert.equal(target.hasRange, false)
    applyLink(editor, target, 'notes.app')
    assert.match(
      editor.getHTML(),
      /Site:<a [^>]*href="https:\/\/notes.app"[^>]*>https:\/\/notes.app<\/a>/
    )
  })

  it('link é configurado para não abrir ao clicar e autolinkar', () => {
    const link = editor.extensionManager.extensions.find((ext) => ext.name === 'link')
    assert.equal(link.options.openOnClick, false)
    assert.equal(link.options.autolink, true)
    assert.equal(link.options.linkOnPaste, true)
    assert.equal(link.options.defaultProtocol, 'https')
  })

  it('toggleHighlight liga e desliga a marca', () => {
    editor.commands.setContent('<p>Prazo</p>')
    editor.commands.selectAll()
    assert.ok(editor.commands.toggleHighlight())
    assert.ok(marksOfFirstText(editor.getJSON()).some((mark) => mark.type === 'highlight'))
    assert.match(editor.getHTML(), /<mark/)
    assert.ok(editor.commands.toggleHighlight())
    assert.equal(
      marksOfFirstText(editor.getJSON()).some((mark) => mark.type === 'highlight'),
      false
    )
  })

  it('setColor grava textStyle.color e unsetColor remove', () => {
    editor.commands.setContent('<p>Atenção</p>')
    editor.commands.selectAll()
    assert.ok(editor.commands.setColor('var(--c1)'))
    const style = marksOfFirstText(editor.getJSON()).find((mark) => mark.type === 'textStyle')
    assert.ok(style)
    assert.equal(style.attrs.color, 'var(--c1)')
    assert.match(editor.getHTML(), /color: var\(--c1\)/)
    assert.ok(editor.commands.unsetColor())
    assert.equal(
      marksOfFirstText(editor.getJSON()).some((mark) => mark.type === 'textStyle'),
      false
    )
  })

  it('setTextAlign em parágrafo e título', () => {
    editor.commands.setContent('<h2>Decisões</h2>')
    assert.ok(editor.commands.setTextAlign('center'))
    assert.equal(editor.getJSON().content[0].attrs.textAlign, 'center')
    assert.match(editor.getHTML(), /text-align: center/)
  })

  it('títulos só até o nível 3', () => {
    editor.commands.setContent('<h4>Quatro</h4><h1>Um</h1>')
    const types = editor.getJSON().content.map((node) => [node.type, node.attrs?.level])
    assert.deepEqual(types[0], ['paragraph', undefined])
    assert.deepEqual(types[1], ['heading', 1])
  })

  it('bloco de código guarda o rótulo de linguagem', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'ls' }] }
      ]
    })
    assert.equal(editor.getJSON().content[0].attrs.language, 'bash')
    assert.match(editor.getHTML(), /class="language-bash"/)
  })

  it('roundtrip getJSON → setContent → getJSON é idêntico para o richDoc do seed', () => {
    editor.commands.setContent(richDoc)
    const first = editor.getJSON()
    assert.doesNotThrow(() => editor.state.doc.check())
    editor.commands.setContent(first)
    const second = editor.getJSON()
    assert.equal(JSON.stringify(second), JSON.stringify(first))

    // o seed cobre os nós que as capturas precisam mostrar
    const types = new Set(first.content.map((node) => node.type))
    for (const type of ['table', 'codeBlock', 'blockquote', 'taskList', 'bulletList', 'heading']) {
      assert.ok(types.has(type), `richDoc tem ${type}`)
    }
    const table = first.content.find((node) => node.type === 'table')
    assert.equal(table.content.length, 3)
    assert.equal(table.content[0].content[0].type, 'tableHeader')
    assert.equal(table.content[0].content.length, 3)
  })

  it('setContent com o mesmo JSON não marca alteração de conteúdo', () => {
    editor.commands.setContent(richDoc)
    const before = editor.state.doc
    editor.commands.setContent(editor.getJSON())
    assert.ok(editor.state.doc.eq(before))
  })
})
