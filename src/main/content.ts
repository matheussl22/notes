/**
 * Texto plano e tarefas a partir do JSON do Tiptap. Alimenta a busca (FTS) e a
 * tabela `tasks`. Precisa conhecer tabelas, imagens e listas aninhadas.
 */
type JsonNode = {
  type?: string
  text?: string
  attrs?: { checked?: boolean; alt?: string | null; title?: string | null }
  content?: JsonNode[]
}

export type ExtractedTask = {
  text: string
  done: boolean
  position: number
}

export function parseDoc(bodyJson: string): JsonNode {
  try {
    const parsed = JSON.parse(bodyJson) as JsonNode
    return parsed && typeof parsed === 'object' ? parsed : { type: 'doc' }
  } catch {
    return { type: 'doc' }
  }
}

const LIST_TYPES = new Set(['taskList', 'bulletList', 'orderedList'])

function nodeText(node: JsonNode): string {
  if (typeof node.text === 'string') return node.text
  if (node.type === 'hardBreak') return ' '
  if (node.type === 'image') {
    // nome do arquivo entra na busca; alt e title costumam ser iguais
    const alt = node.attrs?.alt?.trim() ?? ''
    const title = node.attrs?.title?.trim() ?? ''
    return alt === title ? alt : [alt, title].filter(Boolean).join(' ')
  }
  // blocos, células e linhas de tabela viram texto separado por espaço
  return (node.content ?? []).map(nodeText).join(' ')
}

export function extractPlainText(node: JsonNode): string {
  return nodeText(node).replace(/\s+/g, ' ').trim()
}

/**
 * Cada `taskItem` vira uma tarefa com o texto próprio (sem as sublistas) e
 * as sublistas continuam sendo percorridas — tarefas aninhadas e tarefas
 * dentro de células de tabela contam também.
 */
export function extractTasks(node: JsonNode): ExtractedTask[] {
  const tasks: ExtractedTask[] = []

  const walk = (current: JsonNode): void => {
    if (current.type === 'taskItem') {
      const own = (current.content ?? []).filter((child) => !LIST_TYPES.has(child.type ?? ''))
      const text = extractPlainText({ content: own })
      if (text) {
        tasks.push({ text, done: Boolean(current.attrs?.checked), position: tasks.length })
      }
      for (const child of current.content ?? []) {
        if (LIST_TYPES.has(child.type ?? '')) walk(child)
      }
      return
    }
    for (const child of current.content ?? []) walk(child)
  }

  walk(node)
  return tasks
}
