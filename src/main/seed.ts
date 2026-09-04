/**
 * Dados de exemplo para o harness de screenshot (`NOTES_SHOT_DIR`).
 * Só roda em um userData temporário; nunca toca o banco real do usuário.
 *
 * Os documentos usam apenas nós que o editor conhece. Ao adicionar extensões
 * novas ao editor (tabela, imagem…), enriqueça `richDoc` aqui para que as
 * capturas mostrem o recurso.
 */
import { createNote, createProject, updateNote, updateProject } from './db'

type Node = Record<string, unknown>

const p = (text: string): Node => ({ type: 'paragraph', content: [{ type: 'text', text }] })
const h = (level: number, text: string): Node => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }]
})
const bullets = (items: string[]): Node => ({
  type: 'bulletList',
  content: items.map((text) => ({ type: 'listItem', content: [p(text)] }))
})
const tasks = (items: [string, boolean][]): Node => ({
  type: 'taskList',
  content: items.map(([text, checked]) => ({
    type: 'taskItem',
    attrs: { checked },
    content: [p(text)]
  }))
})
const cell = (type: 'tableHeader' | 'tableCell', text: string): Node => ({
  type,
  attrs: { colspan: 1, rowspan: 1, colwidth: null },
  content: [p(text)]
})
/** tabela com a primeira linha de cabeçalho */
const table = (header: string[], rows: string[][]): Node => ({
  type: 'table',
  content: [
    { type: 'tableRow', content: header.map((text) => cell('tableHeader', text)) },
    ...rows.map((row) => ({
      type: 'tableRow',
      content: row.map((text) => cell('tableCell', text))
    }))
  ]
})
const code = (language: string | null, text: string): Node => ({
  type: 'codeBlock',
  attrs: { language },
  content: [{ type: 'text', text }]
})
const quote = (text: string): Node => ({ type: 'blockquote', content: [p(text)] })

export const richDoc: Node = {
  type: 'doc',
  content: [
    p('Reunião de alinhamento com a equipe de obra. Decisões abaixo, pendências no fim.'),
    h(2, 'Decisões'),
    bullets([
      'Piso vinílico na recepção, cor carvalho claro.',
      'Ar-condicionado split 12k em cada sala.',
      'Iluminação indireta no corredor.'
    ]),
    h(2, 'Orçamentos'),
    table(
      ['Fornecedor', 'Valor', 'Prazo'],
      [
        ['Marmoraria Silva', 'R$ 8.400,00', '15 dias'],
        ['Vidraçaria Central', 'R$ 5.150,00', '3 semanas']
      ]
    ),
    quote('O eletricista só confirma o prazo depois da planta atualizada. — Ana, arquiteta'),
    h(2, 'Pendências'),
    tasks([
      ['Pedir orçamento da clínica X', true],
      ['Confirmar prazo com o eletricista', false],
      ['Enviar planta atualizada para a arquiteta', false]
    ]),
    code('bash', 'ssh obra@192.168.0.12\ncat /var/log/quadro.log | tail -20'),
    p('Prazo final combinado: primeira semana de outubro.')
  ]
}

export function seedSampleData(): { projectId: number; noteId: number } {
  const consultorio = createProject('Reforma do consultório')
  updateProject(consultorio.id, {
    description: 'Sala pronta para atender em setembro. Orçamentos, fornecedores e prazos.'
  })
  // nova nota entra no topo: criar "Fornecedores" antes deixa a nota rica em primeiro
  const fornecedores = createNote(consultorio.id, 'Fornecedores')
  updateNote(fornecedores.id, {
    bodyJson: JSON.stringify({
      type: 'doc',
      content: [bullets(['Marmoraria Silva — bancadas', 'Vidraçaria Central — box e divisórias'])]
    })
  })
  const orcamentos = createNote(consultorio.id, 'Reunião com a obra')
  updateNote(orcamentos.id, { bodyJson: JSON.stringify(richDoc) })
  const antiga = createNote(consultorio.id, 'Ideias iniciais')
  updateNote(antiga.id, { completed: true })

  const estudos = createProject('Estudos')
  const leitura = createNote(estudos.id, 'Leituras de setembro')
  updateNote(leitura.id, {
    bodyJson: JSON.stringify({
      type: 'doc',
      content: [
        tasks([
          ['Capítulo 3 — anatomia', false],
          ['Artigo sobre dor crônica', true]
        ])
      ]
    })
  })
  createNote(estudos.id, '')

  const casa = createProject('Casa')
  createNote(casa.id, 'Lista do mercado')

  return { projectId: consultorio.id, noteId: orcamentos.id }
}
