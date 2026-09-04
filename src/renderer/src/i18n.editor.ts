/** Textos do editor de texto. Dono: NoteEditor. Toda chave precisa existir em pt, en e es. */
import type { Locale } from './i18n'

export type EditorMessages = {
  /* marcas inline */
  bold: string
  italic: string
  underline: string
  strike: string
  inlineCode: string
  highlight: string
  textColor: string
  noColor: string
  /* alinhamento */
  align: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  /* listas */
  bulletList: string
  orderedList: string
  taskList: string
  /* estilo do bloco */
  blockStyle: string
  paragraph: string
  heading1: string
  heading2: string
  heading3: string
  /* inserir */
  insert: string
  table: string
  image: string
  codeBlock: string
  quote: string
  divider: string
  link: string
  undo: string
  redo: string
  /* menu da tabela */
  rowAbove: string
  rowBelow: string
  colLeft: string
  colRight: string
  deleteRow: string
  deleteCol: string
  toggleHeaderRow: string
  mergeCells: string
  splitCell: string
  deleteTable: string
  /* link */
  linkUrl: string
  apply: string
  removeLink: string
  openLink: string
  /* imagem */
  removeImage: string
  resizeImage: string
  /* bloco de código */
  codeLanguage: string
  /* menu "/" */
  slashHeading1: string
  slashHeading1Desc: string
  slashHeading2: string
  slashHeading2Desc: string
  slashHeading3: string
  slashHeading3Desc: string
  slashBullet: string
  slashBulletDesc: string
  slashOrdered: string
  slashOrderedDesc: string
  slashTask: string
  slashTaskDesc: string
  slashTable: string
  slashTableDesc: string
  slashImage: string
  slashImageDesc: string
  slashCode: string
  slashCodeDesc: string
  slashQuote: string
  slashQuoteDesc: string
  slashDivider: string
  slashDividerDesc: string
  slashDate: string
  slashDateDesc: string
  slashEmpty: string
  editorPlaceholder: string
}

export const editorMessages: Record<Locale, EditorMessages> = {
  pt: {
    bold: 'Negrito',
    italic: 'Itálico',
    underline: 'Sublinhado',
    strike: 'Tachado',
    inlineCode: 'Código',
    highlight: 'Marca-texto',
    textColor: 'Cor do texto',
    noColor: 'Sem cor',
    align: 'Alinhamento',
    alignLeft: 'Alinhar à esquerda',
    alignCenter: 'Centralizar',
    alignRight: 'Alinhar à direita',
    bulletList: 'Lista',
    orderedList: 'Lista numerada',
    taskList: 'Checklist',
    blockStyle: 'Estilo do texto',
    paragraph: 'Texto',
    heading1: 'Título 1',
    heading2: 'Título 2',
    heading3: 'Título 3',
    insert: 'Inserir',
    table: 'Tabela',
    image: 'Imagem',
    codeBlock: 'Bloco de código',
    quote: 'Citação',
    divider: 'Divisor',
    link: 'Link',
    undo: 'Desfazer',
    redo: 'Refazer',
    rowAbove: 'Linha acima',
    rowBelow: 'Linha abaixo',
    colLeft: 'Coluna à esquerda',
    colRight: 'Coluna à direita',
    deleteRow: 'Excluir linha',
    deleteCol: 'Excluir coluna',
    toggleHeaderRow: 'Linha de cabeçalho',
    mergeCells: 'Mesclar células',
    splitCell: 'Dividir célula',
    deleteTable: 'Excluir tabela',
    linkUrl: 'https://',
    apply: 'Aplicar',
    removeLink: 'Remover',
    openLink: 'Ctrl+clique para abrir',
    removeImage: 'Remover imagem',
    resizeImage: 'Arraste para redimensionar',
    codeLanguage: 'linguagem',
    slashHeading1: 'Título 1',
    slashHeading1Desc: 'Título grande de seção',
    slashHeading2: 'Título 2',
    slashHeading2Desc: 'Título médio',
    slashHeading3: 'Título 3',
    slashHeading3Desc: 'Título pequeno',
    slashBullet: 'Lista',
    slashBulletDesc: 'Lista com marcadores',
    slashOrdered: 'Lista numerada',
    slashOrderedDesc: 'Lista com números',
    slashTask: 'Checklist',
    slashTaskDesc: 'Itens com caixa de seleção',
    slashTable: 'Tabela',
    slashTableDesc: '3 colunas com linha de cabeçalho',
    slashImage: 'Imagem',
    slashImageDesc: 'Escolher um arquivo do computador',
    slashCode: 'Bloco de código',
    slashCodeDesc: 'Texto monoespaçado',
    slashQuote: 'Citação',
    slashQuoteDesc: 'Trecho destacado',
    slashDivider: 'Divisor',
    slashDividerDesc: 'Linha horizontal',
    slashDate: 'Data de hoje',
    slashDateDesc: 'Insere a data atual',
    slashEmpty: 'Nenhum comando',
    editorPlaceholder: 'Escreva aqui. Digite / para inserir tabela, imagem, lista…'
  },
  en: {
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strike: 'Strikethrough',
    inlineCode: 'Code',
    highlight: 'Highlight',
    textColor: 'Text color',
    noColor: 'No color',
    align: 'Alignment',
    alignLeft: 'Align left',
    alignCenter: 'Center',
    alignRight: 'Align right',
    bulletList: 'Bullet list',
    orderedList: 'Numbered list',
    taskList: 'Checklist',
    blockStyle: 'Text style',
    paragraph: 'Text',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    insert: 'Insert',
    table: 'Table',
    image: 'Image',
    codeBlock: 'Code block',
    quote: 'Quote',
    divider: 'Divider',
    link: 'Link',
    undo: 'Undo',
    redo: 'Redo',
    rowAbove: 'Row above',
    rowBelow: 'Row below',
    colLeft: 'Column left',
    colRight: 'Column right',
    deleteRow: 'Delete row',
    deleteCol: 'Delete column',
    toggleHeaderRow: 'Header row',
    mergeCells: 'Merge cells',
    splitCell: 'Split cell',
    deleteTable: 'Delete table',
    linkUrl: 'https://',
    apply: 'Apply',
    removeLink: 'Remove',
    openLink: 'Ctrl+click to open',
    removeImage: 'Remove image',
    resizeImage: 'Drag to resize',
    codeLanguage: 'language',
    slashHeading1: 'Heading 1',
    slashHeading1Desc: 'Large section heading',
    slashHeading2: 'Heading 2',
    slashHeading2Desc: 'Medium heading',
    slashHeading3: 'Heading 3',
    slashHeading3Desc: 'Small heading',
    slashBullet: 'Bullet list',
    slashBulletDesc: 'List with bullets',
    slashOrdered: 'Numbered list',
    slashOrderedDesc: 'List with numbers',
    slashTask: 'Checklist',
    slashTaskDesc: 'Items with checkboxes',
    slashTable: 'Table',
    slashTableDesc: '3 columns with a header row',
    slashImage: 'Image',
    slashImageDesc: 'Pick a file from your computer',
    slashCode: 'Code block',
    slashCodeDesc: 'Monospaced text',
    slashQuote: 'Quote',
    slashQuoteDesc: 'Highlighted passage',
    slashDivider: 'Divider',
    slashDividerDesc: 'Horizontal line',
    slashDate: "Today's date",
    slashDateDesc: 'Inserts the current date',
    slashEmpty: 'No commands',
    editorPlaceholder: 'Write here. Type / to insert a table, image, list…'
  },
  es: {
    bold: 'Negrita',
    italic: 'Cursiva',
    underline: 'Subrayado',
    strike: 'Tachado',
    inlineCode: 'Código',
    highlight: 'Resaltar',
    textColor: 'Color del texto',
    noColor: 'Sin color',
    align: 'Alineación',
    alignLeft: 'Alinear a la izquierda',
    alignCenter: 'Centrar',
    alignRight: 'Alinear a la derecha',
    bulletList: 'Lista',
    orderedList: 'Lista numerada',
    taskList: 'Lista de tareas',
    blockStyle: 'Estilo del texto',
    paragraph: 'Texto',
    heading1: 'Título 1',
    heading2: 'Título 2',
    heading3: 'Título 3',
    insert: 'Insertar',
    table: 'Tabla',
    image: 'Imagen',
    codeBlock: 'Bloque de código',
    quote: 'Cita',
    divider: 'Divisor',
    link: 'Enlace',
    undo: 'Deshacer',
    redo: 'Rehacer',
    rowAbove: 'Fila arriba',
    rowBelow: 'Fila abajo',
    colLeft: 'Columna a la izquierda',
    colRight: 'Columna a la derecha',
    deleteRow: 'Eliminar fila',
    deleteCol: 'Eliminar columna',
    toggleHeaderRow: 'Fila de encabezado',
    mergeCells: 'Combinar celdas',
    splitCell: 'Dividir celda',
    deleteTable: 'Eliminar tabla',
    linkUrl: 'https://',
    apply: 'Aplicar',
    removeLink: 'Quitar',
    openLink: 'Ctrl+clic para abrir',
    removeImage: 'Quitar imagen',
    resizeImage: 'Arrastra para cambiar el tamaño',
    codeLanguage: 'lenguaje',
    slashHeading1: 'Título 1',
    slashHeading1Desc: 'Título grande de sección',
    slashHeading2: 'Título 2',
    slashHeading2Desc: 'Título mediano',
    slashHeading3: 'Título 3',
    slashHeading3Desc: 'Título pequeño',
    slashBullet: 'Lista',
    slashBulletDesc: 'Lista con viñetas',
    slashOrdered: 'Lista numerada',
    slashOrderedDesc: 'Lista con números',
    slashTask: 'Lista de tareas',
    slashTaskDesc: 'Elementos con casilla',
    slashTable: 'Tabla',
    slashTableDesc: '3 columnas con fila de encabezado',
    slashImage: 'Imagen',
    slashImageDesc: 'Elegir un archivo del equipo',
    slashCode: 'Bloque de código',
    slashCodeDesc: 'Texto monoespaciado',
    slashQuote: 'Cita',
    slashQuoteDesc: 'Fragmento destacado',
    slashDivider: 'Divisor',
    slashDividerDesc: 'Línea horizontal',
    slashDate: 'Fecha de hoy',
    slashDateDesc: 'Inserta la fecha actual',
    slashEmpty: 'Ningún comando',
    editorPlaceholder: 'Escribe aquí. Escribe / para insertar tabla, imagen, lista…'
  }
}
