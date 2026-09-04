import { findParentNode, useEditorState, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { CellSelection } from '@tiptap/pm/tables'
import { useSettings } from '../settings-context'
import { Icon, type IconName } from './icons'

type Props = { editor: Editor }

type Item =
  { icon: IconName; title: string; run: () => void; disabled?: boolean; danger?: boolean } | 'sep'

/** Menu compacto ancorado à tabela ativa, estilo Confluence. */
export function TableMenu({ editor }: Props): React.JSX.Element {
  const { t } = useSettings()
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      inTable: e.isActive('table'),
      canMerge: e.can().mergeCells(),
      canSplit: e.can().splitCell(),
      multi: e.state.selection instanceof CellSelection && e.state.selection.ranges.length > 1
    })
  })

  const run =
    (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => () =>
      command(editor.chain().focus()).run()

  const items: Item[] = [
    { icon: 'rowAbove', title: t.rowAbove, run: run((c) => c.addRowBefore()) },
    { icon: 'rowBelow', title: t.rowBelow, run: run((c) => c.addRowAfter()) },
    { icon: 'colLeft', title: t.colLeft, run: run((c) => c.addColumnBefore()) },
    { icon: 'colRight', title: t.colRight, run: run((c) => c.addColumnAfter()) },
    'sep',
    { icon: 'deleteRow', title: t.deleteRow, run: run((c) => c.deleteRow()) },
    { icon: 'deleteCol', title: t.deleteCol, run: run((c) => c.deleteColumn()) },
    'sep',
    { icon: 'headerRow', title: t.toggleHeaderRow, run: run((c) => c.toggleHeaderRow()) },
    {
      icon: 'merge',
      title: t.mergeCells,
      run: run((c) => c.mergeCells()),
      disabled: !(s.multi && s.canMerge)
    },
    { icon: 'split', title: t.splitCell, run: run((c) => c.splitCell()), disabled: !s.canSplit },
    'sep',
    { icon: 'trash', title: t.deleteTable, run: run((c) => c.deleteTable()), danger: true }
  ]

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableMenu"
      className="bubble bubble-table"
      updateDelay={80}
      options={{ placement: 'bottom', offset: 6 }}
      shouldShow={({ editor: e }) => e.isEditable && e.isActive('table')}
      getReferencedVirtualElement={() => {
        const table = findParentNode((node) => node.type.name === 'table')(editor.state.selection)
        if (!table) return null
        const dom = editor.view.nodeDOM(table.pos) as HTMLElement | null
        if (!dom) return null
        return { getBoundingClientRect: () => dom.getBoundingClientRect(), contextElement: dom }
      }}
    >
      {items.map((item, index) =>
        item === 'sep' ? (
          <span key={`sep-${index}`} className="sep" />
        ) : (
          <button
            key={item.icon}
            type="button"
            title={item.title}
            disabled={item.disabled}
            className={item.danger ? 'is-danger' : ''}
            onMouseDown={(event) => event.preventDefault()}
            onClick={item.run}
          >
            <Icon name={item.icon} />
          </button>
        )
      )}
    </BubbleMenu>
  )
}
