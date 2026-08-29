export type Locale = 'pt' | 'en' | 'es'

export const locales: { id: Locale; label: string }[] = [
  { id: 'pt', label: 'Português' },
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' }
]

export type Messages = {
  appName: string
  search: string
  project: string
  note: string
  newNote: string
  untitled: string
  untitledProject: string
  hideArchived: string
  showArchived: (n: number) => string
  emptyTitle: string
  emptyHint: string
  more: string
  delete: string
  archive: string
  unarchive: string
  newProject: string
  projectName: string
  create: string
  cancel: string
  deleteProject: string
  deleteProjectAsk: (name: string) => string
  deleteNote: string
  deleteNoteAsk: string
  projectDescription: string
  attachments: string
  attach: string
  remove: string
  settings: string
  appearance: string
  language: string
  done: string
  bold: string
  italic: string
  heading: string
  list: string
  checkbox: string
  editorPlaceholder: string
}

export const untitledNames = new Set(['', 'Sem título', 'Untitled', 'Sin título'])
export const untitledProjects = new Set(['', 'Sem nome', 'Untitled', 'Sin nombre'])

export const messages: Record<Locale, Messages> = {
  pt: {
    appName: 'Notes',
    search: 'Buscar',
    project: 'Projeto',
    note: 'nota',
    newNote: 'Nova nota',
    untitled: 'Sem título',
    untitledProject: 'Sem nome',
    hideArchived: 'Ocultar arquivadas',
    showArchived: (n) => `${n} arquivada(s)`,
    emptyTitle: 'Nenhuma nota aberta',
    emptyHint: 'Selecione uma nota à esquerda',
    more: 'Mais',
    delete: 'Apagar',
    archive: 'Arquivar',
    unarchive: 'Desarquivar',
    newProject: 'Novo projeto',
    projectName: 'Nome do projeto',
    create: 'Criar',
    cancel: 'Cancelar',
    deleteProject: 'Apagar projeto',
    deleteProjectAsk: (name) => `Apagar “${name}” e tudo dentro dele?`,
    deleteNote: 'Apagar nota',
    deleteNoteAsk: 'Apagar esta nota?',
    projectDescription: 'Descrição do projeto — o que importa lembrar.',
    attachments: 'Anexos',
    attach: 'Anexar',
    remove: 'Remover',
    settings: 'Configurações',
    appearance: 'Coloração',
    language: 'Idioma',
    done: 'Pronto',
    bold: 'Negrito',
    italic: 'Itálico',
    heading: 'Título',
    list: 'Lista',
    checkbox: 'Checkbox',
    editorPlaceholder: 'Escreva aqui. Use a barra para checkbox, título e lista.'
  },
  en: {
    appName: 'Notes',
    search: 'Search',
    project: 'Project',
    note: 'note',
    newNote: 'New note',
    untitled: 'Untitled',
    untitledProject: 'Untitled',
    hideArchived: 'Hide archived',
    showArchived: (n) => `${n} archived`,
    emptyTitle: 'No note open',
    emptyHint: 'Select a note on the left',
    more: 'More',
    delete: 'Delete',
    archive: 'Archive',
    unarchive: 'Unarchive',
    newProject: 'New project',
    projectName: 'Project name',
    create: 'Create',
    cancel: 'Cancel',
    deleteProject: 'Delete project',
    deleteProjectAsk: (name) => `Delete “${name}” and everything inside it?`,
    deleteNote: 'Delete note',
    deleteNoteAsk: 'Delete this note?',
    projectDescription: 'Project description — what you need to remember.',
    attachments: 'Attachments',
    attach: 'Attach',
    remove: 'Remove',
    settings: 'Settings',
    appearance: 'Colors',
    language: 'Language',
    done: 'Done',
    bold: 'Bold',
    italic: 'Italic',
    heading: 'Heading',
    list: 'List',
    checkbox: 'Checkbox',
    editorPlaceholder: 'Write here. Use the toolbar for checkbox, heading, and list.'
  },
  es: {
    appName: 'Notes',
    search: 'Buscar',
    project: 'Proyecto',
    note: 'nota',
    newNote: 'Nueva nota',
    untitled: 'Sin título',
    untitledProject: 'Sin nombre',
    hideArchived: 'Ocultar archivadas',
    showArchived: (n) => `${n} archivada(s)`,
    emptyTitle: 'Ninguna nota abierta',
    emptyHint: 'Selecciona una nota a la izquierda',
    more: 'Más',
    delete: 'Eliminar',
    archive: 'Archivar',
    unarchive: 'Desarchivar',
    newProject: 'Nuevo proyecto',
    projectName: 'Nombre del proyecto',
    create: 'Crear',
    cancel: 'Cancelar',
    deleteProject: 'Eliminar proyecto',
    deleteProjectAsk: (name) => `¿Eliminar “${name}” y todo lo que contiene?`,
    deleteNote: 'Eliminar nota',
    deleteNoteAsk: '¿Eliminar esta nota?',
    projectDescription: 'Descripción del proyecto — lo que importa recordar.',
    attachments: 'Adjuntos',
    attach: 'Adjuntar',
    remove: 'Quitar',
    settings: 'Ajustes',
    appearance: 'Color',
    language: 'Idioma',
    done: 'Listo',
    bold: 'Negrita',
    italic: 'Cursiva',
    heading: 'Título',
    list: 'Lista',
    checkbox: 'Casilla',
    editorPlaceholder: 'Escribe aquí. Usa la barra para casilla, título y lista.'
  }
}

export function displayNoteTitle(title: string, t: Messages): string {
  return untitledNames.has(title.trim()) ? t.untitled : title
}

export function isUntitledNote(title: string): boolean {
  return untitledNames.has(title.trim())
}
