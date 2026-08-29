import type { NotesApi } from './index'

declare global {
  interface Window {
    api: NotesApi
  }
}

export {}
