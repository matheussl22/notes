/**
 * Nó `image` do editor. Estende o Image do Tiptap com:
 *  - `width`: largura em px (number | null). Renderizada como `style="width: Npx"`.
 *  - `align`: 'left' | 'center' | 'right' (padrão 'left'), renderizada como `data-align`.
 *
 * Sem React nem `window.api`: este arquivo também roda nos testes headless.
 * O node view React (alças de redimensionamento, barra de alinhamento) é
 * injetado pelo componente via `notesEditorExtensions(placeholder, { image })`.
 */
import Image from '@tiptap/extension-image'

export type ImageAlign = 'left' | 'center' | 'right'

export const IMAGE_MIN_WIDTH = 80

const ALIGNS: ImageAlign[] = ['left', 'center', 'right']

export function normalizeAlign(value: unknown): ImageAlign {
  return ALIGNS.includes(value as ImageAlign) ? (value as ImageAlign) : 'left'
}

/** Aceita "320", "320px" ou número; devolve inteiro >= IMAGE_MIN_WIDTH ou null. */
export function normalizeWidth(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : parseFloat(String(value))
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.max(IMAGE_MIN_WIDTH, Math.round(parsed))
}

export const NotesImage = Image.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: null,
        parseHTML: (element) =>
          normalizeWidth(element.getAttribute('width') ?? element.style.width),
        renderHTML: (attributes) => {
          const width = normalizeWidth(attributes.width)
          return width ? { width, style: `width: ${width}px` } : {}
        }
      },
      align: {
        default: 'left',
        parseHTML: (element) => normalizeAlign(element.getAttribute('data-align')),
        renderHTML: (attributes) => ({ 'data-align': normalizeAlign(attributes.align) })
      }
    }
  }
}).configure({ inline: false, allowBase64: false })
