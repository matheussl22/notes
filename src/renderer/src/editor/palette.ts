/**
 * Paleta de cor do texto. Os valores ficam em editor.css (`--c1..--c6`, com
 * versão para o tema night); o documento grava a referência à variável, então
 * a cor acompanha o tema.
 */
export const PALETTE = [
  'var(--c1)',
  'var(--c2)',
  'var(--c3)',
  'var(--c4)',
  'var(--c5)',
  'var(--c6)'
] as const
