type JsonNode = {
  type?: string
  text?: string
  attrs?: { checked?: boolean }
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

export function extractPlainText(node: JsonNode): string {
  if (node.text) return node.text
  return (node.content ?? []).map(extractPlainText).join(' ').replace(/\s+/g, ' ').trim()
}

export function extractTasks(node: JsonNode): ExtractedTask[] {
  const tasks: ExtractedTask[] = []

  const walk = (current: JsonNode): void => {
    if (current.type === 'taskItem') {
      const text = extractPlainText(current)
      if (text) {
        tasks.push({
          text,
          done: Boolean(current.attrs?.checked),
          position: tasks.length
        })
      }
      return
    }
    for (const child of current.content ?? []) walk(child)
  }

  walk(node)
  return tasks
}
