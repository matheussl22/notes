/**
 * Liga o menu "/" ao editor: plugin de sugestão do Tiptap + lista React.
 * A lista de comandos e o filtro vivem em `slash-commands.ts` (puro).
 */
import { Extension, type Editor } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion'
import { SlashMenu, type SlashMenuProps } from './SlashMenu'
import {
  filterSlashCommands,
  runSlashCommand,
  type SlashCommand,
  type SlashContext
} from './slash-commands'

export const slashPluginKey = new PluginKey('slashMenu')

type Options = SlashContext & { empty: string }

export function slashExtension(options: Options): Extension {
  return Extension.create({
    name: 'slashMenu',
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashCommand, SlashCommand>({
          editor: this.editor,
          pluginKey: slashPluginKey,
          char: '/',
          startOfLine: false,
          allowSpaces: false,
          // dentro de código o "/" é só um caractere
          allow: ({ editor }) => !editor.isActive('codeBlock'),
          items: ({ query }) => filterSlashCommands(query, options.locale),
          command: ({ editor, range, props }) => runSlashCommand(editor, range, props, options),
          render: () => {
            let component: ReactRenderer<unknown, SlashMenuProps> | null = null
            let unmount: (() => void) | null = null
            let latest: SuggestionProps<SlashCommand, SlashCommand> | null = null
            let selected = 0

            const sync = (): void => {
              if (!component || !latest) return
              const props = latest
              component.updateProps({
                items: props.items,
                selected,
                empty: options.empty,
                onPick: (item: SlashCommand) => props.command(item)
              })
            }

            return {
              onStart: (props) => {
                latest = props
                selected = 0
                component = new ReactRenderer<unknown, SlashMenuProps>(SlashMenu, {
                  editor: props.editor as Editor,
                  props: {
                    items: props.items,
                    selected,
                    empty: options.empty,
                    onPick: (item: SlashCommand) => props.command(item)
                  }
                })
                unmount = props.mount(component.element)
              },
              onUpdate: (props) => {
                latest = props
                selected = Math.min(selected, Math.max(0, props.items.length - 1))
                sync()
              },
              onKeyDown: ({ event }) => {
                if (!latest) return false
                const count = latest.items.length
                if (event.key === 'ArrowUp') {
                  selected = count ? (selected - 1 + count) % count : 0
                  sync()
                  return true
                }
                if (event.key === 'ArrowDown') {
                  selected = count ? (selected + 1) % count : 0
                  sync()
                  return true
                }
                if (event.key === 'Enter' || event.key === 'Tab') {
                  const item = latest.items[selected]
                  if (item) latest.command(item)
                  return true
                }
                // Esc: o plugin fecha sozinho
                return false
              },
              onExit: () => {
                unmount?.()
                component?.destroy()
                component = null
                unmount = null
                latest = null
              }
            }
          }
        })
      ]
    }
  })
}
