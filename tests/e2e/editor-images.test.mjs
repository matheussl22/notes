/**
 * Nó de imagem (atributos width/align), saneamento de documentos antigos e
 * robustez do conteúdo inicial.
 */
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { Editor, getSchema } from '@tiptap/core'
import { ensureDom } from './dom.mjs'
import { notesEditorExtensions } from '../../src/renderer/src/editor/setup.ts'
import { parseJson, sanitizeDoc } from '../../src/renderer/src/editor/document.ts'
import {
  IMAGE_MIN_WIDTH,
  normalizeAlign,
  normalizeWidth
} from '../../src/renderer/src/editor/image-extension.ts'

let editor = null

function createEditor(content = '<p></p>') {
  ensureDom()
  const root = document.createElement('div')
  document.body.appendChild(root)
  return new Editor({ element: root, extensions: notesEditorExtensions(), content })
}

describe('editor: imagens', () => {
  beforeEach(() => {
    editor = createEditor()
  })

  afterEach(() => {
    editor?.destroy()
    editor = null
  })

  it('insere nó image com width/align e lê de volta', () => {
    editor.commands.insertContent({
      type: 'image',
      attrs: { src: 'notes-file://attachment/1', alt: 'planta.png', width: 320, align: 'center' }
    })
    const image = editor.getJSON().content.find((node) => node.type === 'image')
    assert.ok(image)
    // attrs do ProseMirror não têm protótipo; compara pelo JSON
    assert.deepEqual(JSON.parse(JSON.stringify(image.attrs)), {
      src: 'notes-file://attachment/1',
      alt: 'planta.png',
      title: null,
      width: 320,
      align: 'center'
    })
    // trailingNode: parágrafo depois da imagem no fim do documento
    assert.equal(editor.getJSON().content.at(-1).type, 'paragraph')
  })

  it('renderiza width como style em px e align como data-align', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: 'notes-file://attachment/2', alt: 'foto.jpg', width: 200, align: 'right' }
        }
      ]
    })
    const html = editor.getHTML()
    assert.match(html, /width="200"/)
    assert.match(html, /style="width: 200px;?"/)
    assert.match(html, /data-align="right"/)
    assert.match(html, /alt="foto.jpg"/)
  })

  it('ignora imagens base64 ao colar HTML', () => {
    editor.commands.insertContent('<p>antes</p><img src="data:image/png;base64,AAAA"><p>depois</p>')
    const types = editor.getJSON().content.map((node) => node.type)
    assert.ok(!types.includes('image'))
  })

  it('normaliza largura e alinhamento', () => {
    assert.equal(normalizeWidth(null), null)
    assert.equal(normalizeWidth('320px'), 320)
    assert.equal(normalizeWidth(12), IMAGE_MIN_WIDTH)
    assert.equal(normalizeWidth('abc'), null)
    assert.equal(normalizeAlign('center'), 'center')
    assert.equal(normalizeAlign('weird'), 'left')
  })
})

describe('editor: robustez do conteúdo inicial', () => {
  afterEach(() => {
    editor?.destroy()
    editor = null
  })

  it('JSON inválido vira documento vazio', () => {
    const doc = parseJson('{isso não é json')
    assert.equal(doc.type, 'doc')
    assert.equal(doc.content[0].type, 'paragraph')
    assert.equal(parseJson('[1,2]').type, 'doc')
  })

  it('remove nós e marcas desconhecidos mantendo o resto', () => {
    const schema = getSchema(notesEditorExtensions())
    const old = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'ok' }] },
        { type: 'mention', attrs: { id: 1 } },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'com marca', marks: [{ type: 'comment' }, { type: 'bold' }] }
          ]
        }
      ]
    }
    const { doc, dropped } = sanitizeDoc(old, schema)
    assert.deepEqual(dropped.sort(), ['comment', 'mention'])
    assert.equal(doc.content.length, 2)
    assert.deepEqual(doc.content[1].content[0].marks, [{ type: 'bold' }])

    editor = createEditor(doc)
    assert.match(editor.getText(), /ok/)
    assert.match(editor.getText(), /com marca/)
    assert.doesNotThrow(() => editor.state.doc.check())
  })

  it('documento só com nós desconhecidos vira um parágrafo vazio', () => {
    const schema = getSchema(notesEditorExtensions())
    const { doc } = sanitizeDoc({ type: 'doc', content: [{ type: 'mention' }] }, schema)
    assert.deepEqual(doc, { type: 'doc', content: [{ type: 'paragraph' }] })
  })
})
