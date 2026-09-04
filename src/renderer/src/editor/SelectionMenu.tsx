import { isNodeSelection, useEditorState, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { CellSelection } from '@tiptap/pm/tables'
import { useSettings } from '../settings-context'
import { Icon, type IconName } from './icons'
import { withShortcut } from './keys'
import { Popover } from './Popover'
import { ColorPalette } from './Toolbar'

type Props = {
  editor: Editor
  onLink: () => void
}

/** Menu flutuante ao selecionar texto: marcas inline, cor e link. */
export function SelectionMenu({ editor, onLink }: Props): React.JSX.Element {
  const { t } = useSettings()
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      highlight: e.isActive('highlight'),
      link: e.isActive('link'),
      color: (e.getAttributes('textStyle').color as string | undefined) ?? null
    })
  })

  const buttons: { icon: IconName; title: string; on: boolean; run: () => void }[] = [
    {
      icon: 'bold',
      title: withShortcut(t.bold, 'Mod+B'),
      on: s.bold,
      run: () => editor.chain().focus().toggleBold().run()
    },
    {
      icon: 'italic',
      title: withShortcut(t.italic, 'Mod+I'),
      on: s.italic,
      run: () => editor.chain().focus().toggleItalic().run()
    },
    {
      icon: 'underline',
      title: withShortcut(t.underline, 'Mod+U'),
      on: s.underline,
      run: () => editor.chain().focus().toggleUnderline().run()
    },
    {
      icon: 'strike',
      title: withShortcut(t.strike, 'Mod+Shift+S'),
      on: s.strike,
      run: () => editor.chain().focus().toggleStrike().run()
    },
    {
      icon: 'code',
      title: withShortcut(t.inlineCode, 'Mod+E'),
      on: s.code,
      run: () => editor.chain().focus().toggleCode().run()
    },
    {
      icon: 'highlight',
      title: withShortcut(t.highlight, 'Mod+Shift+H'),
      on: s.highlight,
      run: () => editor.chain().focus().toggleHighlight().run()
    }
  ]

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="selectionMenu"
      className="bubble"
      updateDelay={80}
      options={{ placement: 'top', offset: 6 }}
      shouldShow={({ editor: e, state, from, to }) => {
        if (!e.isEditable || from === to) return false
        const { selection } = state
        if (isNodeSelection(selection) || selection instanceof CellSelection) return false
        if (e.isActive('codeBlock')) return false
        return state.doc.textBetween(from, to, ' ').trim().length > 0
      }}
    >
      {buttons.map((button) => (
        <button
          key={button.icon}
          type="button"
          title={button.title}
          className={button.on ? 'is-on' : ''}
          onMouseDown={(event) => event.preventDefault()}
          onClick={button.run}
        >
          <Icon name={button.icon} />
        </button>
      ))}
      <Popover
        title={t.textColor}
        active={Boolean(s.color)}
        label={
          <span
            className="color-ind"
            style={{ '--swatch': s.color ?? 'transparent' } as React.CSSProperties}
          >
            <Icon name="color" />
          </span>
        }
      >
        {(close) => <ColorPalette editor={editor} current={s.color} close={close} />}
      </Popover>
      <span className="sep" />
      <button
        type="button"
        title={withShortcut(t.link, 'Mod+K')}
        className={s.link ? 'is-on' : ''}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onLink}
      >
        <Icon name="link" />
      </button>
    </BubbleMenu>
  )
}
