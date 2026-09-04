/** Textos da barra lateral. Dono: Sidebar. Toda chave precisa existir em pt, en e es. */
import type { Locale } from './i18n'

export type SidebarMessages = {
  search: string
  noResults: string
  hideArchived: string
  showArchived: (n: number) => string
  collapseProject: string
  expandProject: string
  dragToReorder: string
  /** alça de redimensionar a barra */
  resizeSidebar: string
  /** rótulos dos tipos de resultado da busca */
  taskLabel: string
  attachmentLabel: string
}

export const sidebarMessages: Record<Locale, SidebarMessages> = {
  pt: {
    search: 'Buscar',
    noResults: 'Nada encontrado',
    hideArchived: 'Ocultar arquivadas',
    showArchived: (n) => `${n} arquivada(s)`,
    collapseProject: 'Recolher',
    expandProject: 'Expandir',
    dragToReorder: 'Arraste para reordenar',
    resizeSidebar: 'Arraste para redimensionar. Duplo clique restaura a largura.',
    taskLabel: 'Tarefa',
    attachmentLabel: 'Anexo'
  },
  en: {
    search: 'Search',
    noResults: 'Nothing found',
    hideArchived: 'Hide archived',
    showArchived: (n) => `${n} archived`,
    collapseProject: 'Collapse',
    expandProject: 'Expand',
    dragToReorder: 'Drag to reorder',
    resizeSidebar: 'Drag to resize. Double-click to reset the width.',
    taskLabel: 'Task',
    attachmentLabel: 'Attachment'
  },
  es: {
    search: 'Buscar',
    noResults: 'Nada encontrado',
    hideArchived: 'Ocultar archivadas',
    showArchived: (n) => `${n} archivada(s)`,
    collapseProject: 'Contraer',
    expandProject: 'Expandir',
    dragToReorder: 'Arrastra para reordenar',
    resizeSidebar: 'Arrastra para redimensionar. Doble clic restaura el ancho.',
    taskLabel: 'Tarea',
    attachmentLabel: 'Adjunto'
  }
}
