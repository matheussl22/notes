import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TaskItem, TaskList } from '@tiptap/extension-list'

export function notesEditorExtensions(placeholder: string) {
  return [
    StarterKit,
    Placeholder.configure({
      placeholder
    }),
    TaskList,
    TaskItem.configure({ nested: true })
  ]
}
