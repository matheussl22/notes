import { useEditorState, type Editor } from '@tiptap/react'
import { useSettings } from '../settings-context'
import { Icon, type IconName } from './icons'
import { withShortcut } from './keys'
import { PALETTE } from './palette'
import { Popover } from './Popover'
import { TABLE_DEFAULTS } from './setup'

type Props = {
  editor: Editor
  onLink: () => void
  onImage: () => void
}

type Block = 'p' | 'h1' | 'h2' | 'h3'
type Align = 'left' | 'center' | 'right'

function ToolButton({
  icon,
  title,
  on,
  disabled,
  onClick
}: {
  icon: IconName
  title: string
  on?: boolean
  disabled?: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      className={on ? 'is-on' : ''}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  )
}

/** Paleta de cores compartilhada entre toolbar e bubble menu. */
export function ColorPalette({
  editor,
  current,
  close
}: {
  editor: Editor
  current: string | null
  close: () => void
}): React.JSX.Element {
  const { t } = useSettings()
  return (
    <div className="palette">
      {PALETTE.map((color, index) => (
        <button
          key={color}
          type="button"
          className={`swatch ${current === color ? 'is-on' : ''}`}
          title={`${t.textColor} ${index + 1}`}
          style={{ '--swatch': color } as React.CSSProperties}
          onClick={() => {
            editor.chain().focus().setColor(color).run()
            close()
          }}
        />
      ))}
      <button
        type="button"
        className="swatch swatch-none"
        title={t.noColor}
        onClick={() => {
          editor.chain().focus().unsetColor().run()
          close()
        }}
      >
        <Icon name="close" size={12} />
      </button>
    </div>
  )
}

export function Toolbar({ editor, onLink, onImage }: Props): React.JSX.Element {
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
      color: (e.getAttributes('textStyle').color as string | undefined) ?? null,
      align: (e.isActive({ textAlign: 'center' })
        ? 'center'
        : e.isActive({ textAlign: 'right' })
          ? 'right'
          : 'left') as Align,
      block: (e.isActive('heading', { level: 1 })
        ? 'h1'
        : e.isActive('heading', { level: 2 })
          ? 'h2'
          : e.isActive('heading', { level: 3 })
            ? 'h3'
            : 'p') as Block,
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      task: e.isActive('taskList'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      inCodeBlock: e.isActive('codeBlock')
    })
  })

  const blocks: { id: Block; label: string; icon: IconName; keys: string }[] = [
    { id: 'p', label: t.paragraph, icon: 'text', keys: 'Mod+Alt+0' },
    { id: 'h1', label: t.heading1, icon: 'h1', keys: 'Mod+Alt+1' },
    { id: 'h2', label: t.heading2, icon: 'h2', keys: 'Mod+Alt+2' },
    { id: 'h3', label: t.heading3, icon: 'h3', keys: 'Mod+Alt+3' }
  ]
  const currentBlock = blocks.find((block) => block.id === s.block) ?? blocks[0]

  const setBlock = (block: Block): void => {
    const chain = editor.chain().focus()
    if (block === 'p') chain.setParagraph().run()
    else chain.setHeading({ level: Number(block[1]) as 1 | 2 | 3 }).run()
  }

  const aligns: { id: Align; label: string; icon: IconName; keys: string }[] = [
    { id: 'left', label: t.alignLeft, icon: 'alignLeft', keys: 'Mod+Shift+L' },
    { id: 'center', label: t.alignCenter, icon: 'alignCenter', keys: 'Mod+Shift+E' },
    { id: 'right', label: t.alignRight, icon: 'alignRight', keys: 'Mod+Shift+R' }
  ]
  const currentAlign = aligns.find((align) => align.id === s.align) ?? aligns[0]

  const inserts: { label: string; icon: IconName; keys?: string; run: () => void }[] = [
    {
      label: t.table,
      icon: 'table',
      keys: 'Mod+Alt+T',
      run: () => editor.chain().focus().insertTable(TABLE_DEFAULTS).run()
    },
    { label: t.image, icon: 'image', run: onImage },
    {
      label: t.codeBlock,
      icon: 'codeBlock',
      keys: 'Mod+Alt+C',
      run: () => editor.chain().focus().toggleCodeBlock().run()
    },
    {
      label: t.quote,
      icon: 'quote',
      keys: 'Mod+Shift+B',
      run: () => editor.chain().focus().toggleBlockquote().run()
    },
    {
      label: t.divider,
      icon: 'divider',
      run: () => editor.chain().focus().setHorizontalRule().run()
    },
    { label: t.link, icon: 'link', keys: 'Mod+K', run: onLink }
  ]

  return (
    <div className="toolbar" role="toolbar">
      <Popover
        buttonClass="tb-select"
        title={t.blockStyle}
        label={
          <>
            <span>{currentBlock.label}</span>
            <Icon name="chevron" size={14} />
          </>
        }
      >
        {(close) => (
          <div className="tb-menu">
            {blocks.map((block) => (
              <button
                key={block.id}
                type="button"
                className={block.id === s.block ? 'is-on' : ''}
                onClick={() => {
                  setBlock(block.id)
                  close()
                }}
              >
                <Icon name={block.icon} />
                <span>{block.label}</span>
                <kbd>{withShortcut('', block.keys).slice(2, -1)}</kbd>
              </button>
            ))}
          </div>
        )}
      </Popover>
      <span className="sep" />
      <ToolButton
        icon="bold"
        title={withShortcut(t.bold, 'Mod+B')}
        on={s.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolButton
        icon="italic"
        title={withShortcut(t.italic, 'Mod+I')}
        on={s.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolButton
        icon="underline"
        title={withShortcut(t.underline, 'Mod+U')}
        on={s.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolButton
        icon="strike"
        title={withShortcut(t.strike, 'Mod+Shift+S')}
        on={s.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <span className="sep" />
      <ToolButton
        icon="code"
        title={withShortcut(t.inlineCode, 'Mod+E')}
        on={s.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolButton
        icon="highlight"
        title={withShortcut(t.highlight, 'Mod+Shift+H')}
        on={s.highlight}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      />
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
      <Popover title={t.align} label={<Icon name={currentAlign.icon} />}>
        {(close) => (
          <div className="tb-row">
            {aligns.map((align) => (
              <button
                key={align.id}
                type="button"
                title={withShortcut(align.label, align.keys)}
                className={align.id === s.align ? 'is-on' : ''}
                onClick={() => {
                  editor.chain().focus().setTextAlign(align.id).run()
                  close()
                }}
              >
                <Icon name={align.icon} />
              </button>
            ))}
          </div>
        )}
      </Popover>
      <ToolButton
        icon="bulletList"
        title={withShortcut(t.bulletList, 'Mod+Shift+8')}
        on={s.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolButton
        icon="orderedList"
        title={withShortcut(t.orderedList, 'Mod+Shift+7')}
        on={s.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolButton
        icon="taskList"
        title={withShortcut(t.taskList, 'Mod+Shift+9')}
        on={s.task}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />
      <span className="sep" />
      <Popover
        buttonClass="tb-insert"
        title={t.insert}
        label={
          <>
            <Icon name="plus" />
            <span>{t.insert}</span>
          </>
        }
      >
        {(close) => (
          <div className="tb-menu">
            {inserts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  close()
                  item.run()
                }}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.keys && <kbd>{withShortcut('', item.keys).slice(2, -1)}</kbd>}
              </button>
            ))}
          </div>
        )}
      </Popover>
      <span className="sep" />
      <ToolButton
        icon="undo"
        title={withShortcut(t.undo, 'Mod+Z')}
        disabled={!s.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolButton
        icon="redo"
        title={withShortcut(t.redo, 'Mod+Shift+Z')}
        disabled={!s.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  )
}
