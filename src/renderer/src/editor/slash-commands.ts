/**
 * Comandos do menu "/" — lista, filtro e execução.
 *
 * Módulo puro: sem React nem DOM, para poder ser testado em Node. O que
 * precisa de IPC (escolher imagem) entra por `SlashContext`.
 */
import type { Editor, Range } from '@tiptap/core'
import type { Locale } from '../i18n'
import { editorMessages, type EditorMessages } from '../i18n.editor'

export type SlashCommandId =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet'
  | 'ordered'
  | 'task'
  | 'table'
  | 'image'
  | 'code'
  | 'quote'
  | 'divider'
  | 'date'

export type SlashIcon =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'table'
  | 'image'
  | 'codeBlock'
  | 'quote'
  | 'divider'
  | 'calendar'

type Definition = {
  id: SlashCommandId
  icon: SlashIcon
  labelKey: keyof EditorMessages
  descKey: keyof EditorMessages
  /** termos extras de busca, em pt/en/es, sem acento */
  aliases: string[]
}

export type SlashCommand = {
  id: SlashCommandId
  icon: SlashIcon
  label: string
  description: string
}

export type SlashContext = {
  locale: Locale
  /** abre o seletor de imagem e insere o resultado (precisa de IPC; injetado pelo componente) */
  pickImage: (editor: Editor) => void
  /** só para testes: data usada no comando "Data de hoje" */
  now?: () => Date
}

const definitions: Definition[] = [
  {
    id: 'heading1',
    icon: 'h1',
    labelKey: 'slashHeading1',
    descKey: 'slashHeading1Desc',
    aliases: ['h1', 'titulo', 'title', 'heading', 'encabezado']
  },
  {
    id: 'heading2',
    icon: 'h2',
    labelKey: 'slashHeading2',
    descKey: 'slashHeading2Desc',
    aliases: ['h2', 'titulo', 'title', 'heading', 'encabezado', 'subtitulo']
  },
  {
    id: 'heading3',
    icon: 'h3',
    labelKey: 'slashHeading3',
    descKey: 'slashHeading3Desc',
    aliases: ['h3', 'titulo', 'title', 'heading', 'encabezado']
  },
  {
    id: 'bullet',
    icon: 'bulletList',
    labelKey: 'slashBullet',
    descKey: 'slashBulletDesc',
    aliases: ['lista', 'list', 'bullet', 'marcadores', 'ul', 'vinetas']
  },
  {
    id: 'ordered',
    icon: 'orderedList',
    labelKey: 'slashOrdered',
    descKey: 'slashOrderedDesc',
    aliases: ['numerada', 'numbered', 'ordered', 'ol', '1.', 'numeros']
  },
  {
    id: 'task',
    icon: 'taskList',
    labelKey: 'slashTask',
    descKey: 'slashTaskDesc',
    aliases: ['checklist', 'check', 'tarefa', 'task', 'todo', 'checkbox', 'tarea', 'casilla']
  },
  {
    id: 'table',
    icon: 'table',
    labelKey: 'slashTable',
    descKey: 'slashTableDesc',
    aliases: ['tabela', 'table', 'tabla', 'grid', 'colunas', 'columns']
  },
  {
    id: 'image',
    icon: 'image',
    labelKey: 'slashImage',
    descKey: 'slashImageDesc',
    aliases: ['imagem', 'image', 'imagen', 'foto', 'photo', 'picture', 'figura']
  },
  {
    id: 'code',
    icon: 'codeBlock',
    labelKey: 'slashCode',
    descKey: 'slashCodeDesc',
    aliases: ['codigo', 'code', 'bloco', 'block', 'pre', 'mono']
  },
  {
    id: 'quote',
    icon: 'quote',
    labelKey: 'slashQuote',
    descKey: 'slashQuoteDesc',
    aliases: ['citacao', 'quote', 'cita', 'blockquote']
  },
  {
    id: 'divider',
    icon: 'divider',
    labelKey: 'slashDivider',
    descKey: 'slashDividerDesc',
    aliases: ['divisor', 'divider', 'linha', 'line', 'hr', 'separador', 'separator', '---']
  },
  {
    id: 'date',
    icon: 'calendar',
    labelKey: 'slashDate',
    descKey: 'slashDateDesc',
    aliases: ['data', 'date', 'fecha', 'hoje', 'today', 'hoy', 'agora', 'now']
  }
]

const LOCALES: Locale[] = ['pt', 'en', 'es']

// faixa dos acentos combinantes (U+0300–U+036F) após decompor com NFD
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

/** minúsculas, sem acentos */
export function normalizeQuery(text: string): string {
  return text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim()
}

function resolve(definition: Definition, locale: Locale): SlashCommand {
  const t = editorMessages[locale]
  return {
    id: definition.id,
    icon: definition.icon,
    label: t[definition.labelKey],
    description: t[definition.descKey]
  }
}

/** Todos os comandos, com rótulo e descrição no idioma pedido. */
export function slashCommands(locale: Locale = 'pt'): SlashCommand[] {
  return definitions.map((definition) => resolve(definition, locale))
}

/**
 * Filtra por prefixo/substring do rótulo (em qualquer idioma) ou dos aliases.
 * Busca sem acento: "titulo" acha "Título". Query vazia devolve todos.
 * Correspondências no começo do rótulo aparecem antes.
 */
export function filterSlashCommands(query: string, locale: Locale = 'pt'): SlashCommand[] {
  const needle = normalizeQuery(query)
  if (!needle) return slashCommands(locale)

  const scored: { command: SlashCommand; score: number }[] = []
  for (const definition of definitions) {
    const labels = LOCALES.map((id) => normalizeQuery(editorMessages[id][definition.labelKey]))
    const terms = [...labels, ...definition.aliases.map(normalizeQuery)]
    let score = 0
    if (terms.some((term) => term.startsWith(needle))) score = 2
    else if (terms.some((term) => term.includes(needle))) score = 1
    if (score) scored.push({ command: resolve(definition, locale), score })
  }
  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.command)
}

const dateLocales: Record<Locale, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

/** "dd/mm/aaaa" no padrão do idioma (en-US usa mm/dd/aaaa). */
export function formatToday(locale: Locale, date: Date = new Date()): string {
  return new Intl.DateTimeFormat(dateLocales[locale], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

/** Apaga o texto "/consulta" e executa o comando escolhido. */
export function runSlashCommand(
  editor: Editor,
  range: Range,
  command: Pick<SlashCommand, 'id'>,
  context: SlashContext
): void {
  const chain = editor.chain().focus().deleteRange(range)
  switch (command.id) {
    case 'heading1':
      chain.setNode('heading', { level: 1 }).run()
      return
    case 'heading2':
      chain.setNode('heading', { level: 2 }).run()
      return
    case 'heading3':
      chain.setNode('heading', { level: 3 }).run()
      return
    case 'bullet':
      chain.toggleBulletList().run()
      return
    case 'ordered':
      chain.toggleOrderedList().run()
      return
    case 'task':
      chain.toggleTaskList().run()
      return
    case 'table':
      chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      return
    case 'image':
      chain.run()
      context.pickImage(editor)
      return
    case 'code':
      chain.setCodeBlock().run()
      return
    case 'quote':
      chain.toggleBlockquote().run()
      return
    case 'divider':
      chain.setHorizontalRule().run()
      return
    case 'date':
      chain.insertContent(formatToday(context.locale, context.now?.())).run()
      return
  }
}
