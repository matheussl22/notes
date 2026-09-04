export type FileKind = 'image' | 'pdf' | 'sheet' | 'text' | 'other'

const IMAGE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'heic', 'tif'])
const SHEET = new Set(['xls', 'xlsx', 'csv', 'ods', 'numbers', 'tsv'])
const TEXT = new Set(['txt', 'md', 'rtf', 'doc', 'docx', 'odt', 'pages', 'json', 'log'])

/** Classifica um anexo pelo mime e, na falta dele, pela extensão. */
export function fileKind(filename: string, mime: string): FileKind {
  const type = mime.toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type === 'application/pdf') return 'pdf'
  if (type.includes('spreadsheet') || type.includes('excel') || type === 'text/csv') return 'sheet'
  const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
  if (IMAGE.has(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (SHEET.has(ext)) return 'sheet'
  if (TEXT.has(ext) || type.startsWith('text/')) return 'text'
  return 'other'
}
