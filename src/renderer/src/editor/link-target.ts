/** Helpers puros do popover de link (sem React), testáveis em Node. */
import { getMarkRange, type Editor } from '@tiptap/core'

/** Alvo do popover: intervalo a linkar e URL atual (vazio quando novo). */
export type LinkTarget = {
  from: number
  to: number
  href: string
  /** false quando não há seleção nem link sob o cursor: o URL vira texto */
  hasRange: boolean
}

/** Lê a seleção atual e decide o que o popover vai editar. */
export function linkTargetFromSelection(editor: Editor): LinkTarget {
  const { from, to, empty } = editor.state.selection
  const linkType = editor.schema.marks.link
  if (empty && linkType) {
    const range = getMarkRange(editor.state.doc.resolve(from), linkType)
    if (range) {
      const href = (editor.getAttributes('link').href as string | undefined) ?? ''
      return { from: range.from, to: range.to, href, hasRange: true }
    }
    return { from, to, href: '', hasRange: false }
  }
  const href = (editor.getAttributes('link').href as string | undefined) ?? ''
  return { from, to, href, hasRange: true }
}

/** Completa o protocolo quando o usuário digita só o domínio. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** Aplica (ou remove, se o URL ficar vazio) o link no alvo. */
export function applyLink(editor: Editor, target: LinkTarget, value: string): void {
  const href = normalizeUrl(value)
  const chain = editor.chain().focus()
  if (!href) {
    if (target.hasRange) {
      chain.setTextSelection(target).extendMarkRange('link').unsetLink().run()
    }
    return
  }
  if (target.hasRange) {
    chain.setTextSelection(target).extendMarkRange('link').setLink({ href }).run()
    return
  }
  // sem seleção: o próprio URL vira o texto do link
  chain
    .insertContentAt(target.from, {
      type: 'text',
      text: href,
      marks: [{ type: 'link', attrs: { href } }]
    })
    .unsetMark('link')
    .run()
}

export function removeLink(editor: Editor, target: LinkTarget): void {
  if (!target.hasRange) return
  editor.chain().focus().setTextSelection(target).extendMarkRange('link').unsetLink().run()
}
