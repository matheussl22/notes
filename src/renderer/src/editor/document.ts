/**
 * Saneamento do JSON de uma nota antes de entrar no editor.
 *
 * Documentos antigos podem ter nós/marcas que o esquema atual não conhece.
 * O Tiptap, nesse caso, descarta o documento inteiro; aqui descartamos só o
 * que não existe e mantemos o resto. Puro (sem React/DOM) para os testes.
 */
import type { JSONContent } from '@tiptap/core'
import type { Schema } from '@tiptap/pm/model'
import { EMPTY_DOC } from '../../../shared/types'

export type SanitizeResult = {
  doc: JSONContent
  /** tipos de nó/marca removidos (para registrar no console) */
  dropped: string[]
}

export function parseJson(value: string): JSONContent {
  try {
    const parsed = JSON.parse(value) as unknown
    if (parsed && typeof parsed === 'object' && (parsed as JSONContent).type === 'doc') {
      return parsed as JSONContent
    }
  } catch {
    // cai no documento vazio
  }
  return JSON.parse(EMPTY_DOC) as JSONContent
}

function cleanNode(node: JSONContent, schema: Schema, dropped: string[]): JSONContent | null {
  if (!node || typeof node !== 'object') return null
  if (node.type && node.type !== 'doc' && !schema.nodes[node.type]) {
    dropped.push(node.type)
    return null
  }
  const next: JSONContent = { ...node }
  if (Array.isArray(node.marks)) {
    next.marks = node.marks.filter((mark) => {
      if (mark && mark.type && schema.marks[mark.type]) return true
      if (mark?.type) dropped.push(mark.type)
      return false
    })
    if (!next.marks.length) delete next.marks
  }
  if (Array.isArray(node.content)) {
    next.content = node.content
      .map((child) => cleanNode(child, schema, dropped))
      .filter((child): child is JSONContent => child !== null)
    if (!next.content.length) delete next.content
  }
  return next
}

export function sanitizeDoc(doc: JSONContent, schema: Schema): SanitizeResult {
  const dropped: string[] = []
  const cleaned = cleanNode({ ...doc, type: 'doc' }, schema, dropped) ?? { type: 'doc' }
  if (!cleaned.content?.length) cleaned.content = [{ type: 'paragraph' }]
  return { doc: cleaned, dropped: [...new Set(dropped)] }
}
