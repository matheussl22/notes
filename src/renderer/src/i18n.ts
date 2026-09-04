/**
 * Textos da interface. Cada área do app tem seu próprio arquivo de mensagens
 * para que possam evoluir de forma independente:
 *
 * - `i18n.ts`          — núcleo: shell, painéis, diálogos, configurações
 * - `i18n.sidebar.ts`  — barra lateral (projetos, notas, busca)
 * - `i18n.editor.ts`   — editor de texto (toolbar, menus, tabelas, imagens)
 *
 * `messages[locale]` junta tudo. Toda chave precisa existir nos três idiomas.
 */
import { editorMessages, type EditorMessages } from './i18n.editor'
import { sidebarMessages, type SidebarMessages } from './i18n.sidebar'

export type Locale = 'pt' | 'en' | 'es'

export const locales: { id: Locale; label: string }[] = [
  { id: 'pt', label: 'Português' },
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' }
]

export type CoreMessages = {
  appName: string
  project: string
  note: string
  newNote: string
  untitled: string
  untitledProject: string
  emptyHint: string
  /** atalhos mostrados no estado vazio */
  shortcutSplit: string
  shortcutNewNote: string
  more: string
  delete: string
  archive: string
  unarchive: string
  archived: string
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
  /** painéis / split view */
  split: string
  closePane: string
  swapPanes: string
  openInSplit: string
  openProject: string
  notesCount: (n: number) => string
  archivedCount: (n: number) => string
  noNotes: string
  notesLabel: string
  resizeHint: string
}

export type Messages = CoreMessages & SidebarMessages & EditorMessages

export const untitledNames = new Set(['', 'Sem título', 'Untitled', 'Sin título'])
export const untitledProjects = new Set(['', 'Sem nome', 'Untitled', 'Sin nombre'])

const core: Record<Locale, CoreMessages> = {
  pt: {
    appName: 'Notes',
    project: 'Projeto',
    note: 'nota',
    newNote: 'Nova nota',
    untitled: 'Sem título',
    untitledProject: 'Sem nome',
    emptyHint: 'Escolha uma nota à esquerda ou crie uma nova.',
    shortcutSplit: 'dividir a tela',
    shortcutNewNote: 'nova nota',
    more: 'Mais',
    delete: 'Apagar',
    archive: 'Arquivar',
    unarchive: 'Desarquivar',
    archived: 'Arquivada',
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
    split: 'Dividir',
    closePane: 'Fechar painel',
    swapPanes: 'Trocar lados',
    openInSplit: 'Abrir ao lado',
    openProject: 'Abrir projeto',
    notesCount: (n) => (n === 1 ? '1 nota' : `${n} notas`),
    archivedCount: (n) => (n === 1 ? '1 arquivada' : `${n} arquivadas`),
    noNotes: 'Nenhuma nota neste projeto.',
    notesLabel: 'Notas',
    resizeHint: 'Arraste para redimensionar. Duplo clique iguala os lados.'
  },
  en: {
    appName: 'Notes',
    project: 'Project',
    note: 'note',
    newNote: 'New note',
    untitled: 'Untitled',
    untitledProject: 'Untitled',
    emptyHint: 'Pick a note on the left or create a new one.',
    shortcutSplit: 'split the view',
    shortcutNewNote: 'new note',
    more: 'More',
    delete: 'Delete',
    archive: 'Archive',
    unarchive: 'Unarchive',
    archived: 'Archived',
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
    split: 'Split',
    closePane: 'Close pane',
    swapPanes: 'Swap sides',
    openInSplit: 'Open to the side',
    openProject: 'Open project',
    notesCount: (n) => (n === 1 ? '1 note' : `${n} notes`),
    archivedCount: (n) => (n === 1 ? '1 archived' : `${n} archived`),
    noNotes: 'No notes in this project.',
    notesLabel: 'Notes',
    resizeHint: 'Drag to resize. Double-click to even out.'
  },
  es: {
    appName: 'Notes',
    project: 'Proyecto',
    note: 'nota',
    newNote: 'Nueva nota',
    untitled: 'Sin título',
    untitledProject: 'Sin nombre',
    emptyHint: 'Elige una nota a la izquierda o crea una nueva.',
    shortcutSplit: 'dividir la pantalla',
    shortcutNewNote: 'nueva nota',
    more: 'Más',
    delete: 'Eliminar',
    archive: 'Archivar',
    unarchive: 'Desarchivar',
    archived: 'Archivada',
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
    split: 'Dividir',
    closePane: 'Cerrar panel',
    swapPanes: 'Intercambiar lados',
    openInSplit: 'Abrir al lado',
    openProject: 'Abrir proyecto',
    notesCount: (n) => (n === 1 ? '1 nota' : `${n} notas`),
    archivedCount: (n) => (n === 1 ? '1 archivada' : `${n} archivadas`),
    noNotes: 'Ninguna nota en este proyecto.',
    notesLabel: 'Notas',
    resizeHint: 'Arrastra para redimensionar. Doble clic iguala los lados.'
  }
}

export const messages: Record<Locale, Messages> = {
  pt: { ...core.pt, ...sidebarMessages.pt, ...editorMessages.pt },
  en: { ...core.en, ...sidebarMessages.en, ...editorMessages.en },
  es: { ...core.es, ...sidebarMessages.es, ...editorMessages.es }
}

export function displayNoteTitle(title: string, t: Pick<Messages, 'untitled'>): string {
  return untitledNames.has(title.trim()) ? t.untitled : title
}

export function isUntitledNote(title: string): boolean {
  return untitledNames.has(title.trim())
}
