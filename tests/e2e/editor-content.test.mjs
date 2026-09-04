/**
 * content.ts: texto plano e tarefas a partir de documentos com tabela,
 * checklist dentro de célula, listas aninhadas e imagens.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extractPlainText, extractTasks, parseDoc } from '../../src/main/content.ts'

const p = (text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })
const cell = (type, ...content) => ({ type, content })
const task = (text, checked, ...nested) => ({
  type: 'taskItem',
  attrs: { checked },
  content: [p(text), ...nested]
})

const doc = {
  type: 'doc',
  content: [
    p('Orçamentos da obra'),
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [cell('tableHeader', p('Fornecedor')), cell('tableHeader', p('Valor'))]
        },
        {
          type: 'tableRow',
          content: [
            cell('tableCell', p('Marmoraria')),
            cell('tableCell', {
              type: 'taskList',
              content: [task('Pedir nota fiscal', false), task('Conferir medidas', true)]
            })
          ]
        },
        {
          type: 'tableRow',
          content: [
            cell('tableCell', {
              type: 'image',
              attrs: { src: 'notes-file://attachment/3', alt: 'planta.png', title: 'planta.png' }
            }),
            cell('tableCell', p('R$ 8.400,00'))
          ]
        }
      ]
    },
    {
      type: 'taskList',
      content: [
        task('Ligar para o eletricista', false, {
          type: 'taskList',
          content: [task('Confirmar horário', true), task('Enviar planta', false)]
        }),
        task('Fechar com a vidraçaria', false)
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'linha 1' },
        { type: 'hardBreak' },
        { type: 'text', text: 'linha 2' }
      ]
    }
  ]
}

describe('content: texto plano', () => {
  it('separa células e linhas por espaço sem perder texto', () => {
    const text = extractPlainText(doc)
    assert.match(text, /Fornecedor Valor/)
    assert.match(text, /Marmoraria Pedir nota fiscal Conferir medidas/)
    assert.match(text, /R\$ 8\.400,00/)
    assert.ok(!/\s{2}/.test(text), 'sem espaços duplos')
  })

  it('imagens contribuem com o nome do arquivo (alt/title), sem duplicar', () => {
    const text = extractPlainText(doc)
    assert.match(text, /planta\.png R\$ 8\.400,00/)
    assert.equal((text.match(/planta\.png/g) ?? []).length, 1)
    const distinct = extractPlainText({
      type: 'image',
      attrs: { alt: 'Planta baixa', title: 'planta.png' }
    })
    assert.equal(distinct, 'Planta baixa planta.png')
  })

  it('quebra de linha manual vira espaço', () => {
    assert.match(extractPlainText(doc), /linha 1 linha 2/)
  })

  it('parseDoc tolera JSON inválido', () => {
    assert.deepEqual(parseDoc('nada'), { type: 'doc' })
    assert.deepEqual(parseDoc('null'), { type: 'doc' })
    assert.equal(extractPlainText(parseDoc('{"type":"doc"}')), '')
  })
})

describe('content: tarefas', () => {
  it('encontra tarefas em células de tabela e listas aninhadas', () => {
    const tasks = extractTasks(doc)
    assert.deepEqual(
      tasks.map((task) => [task.text, task.done]),
      [
        ['Pedir nota fiscal', false],
        ['Conferir medidas', true],
        ['Ligar para o eletricista', false],
        ['Confirmar horário', true],
        ['Enviar planta', false],
        ['Fechar com a vidraçaria', false]
      ]
    )
    assert.deepEqual(
      tasks.map((task) => task.position),
      [0, 1, 2, 3, 4, 5]
    )
  })

  it('tarefa pai não engole o texto das filhas', () => {
    const tasks = extractTasks(doc)
    const parent = tasks.find((task) => task.text.startsWith('Ligar'))
    assert.equal(parent.text, 'Ligar para o eletricista')
  })

  it('ignora itens vazios', () => {
    const tasks = extractTasks({
      type: 'doc',
      content: [{ type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false } }] }]
    })
    assert.deepEqual(tasks, [])
  })
})
