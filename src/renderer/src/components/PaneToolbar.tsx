import { useSettings } from '../settings-context'
import { IconClose, IconSplit, IconSwap } from './Icons'
import type { PaneActions } from './Workspace'

/**
 * Ações do painel, na mesma linha do título, à direita do "···":
 * dividir (1 painel) / trocar lados e fechar (2 painéis).
 */
export function PaneToolbar({ actions }: { actions: PaneActions }): React.JSX.Element {
  const { t } = useSettings()
  return (
    <div className="pane-toolbar">
      {actions.canSplit && (
        <button type="button" className="pane-tool" title={t.split} onClick={actions.onSplit}>
          <IconSplit />
        </button>
      )}
      {actions.canSwap && (
        <button type="button" className="pane-tool" title={t.swapPanes} onClick={actions.onSwap}>
          <IconSwap />
        </button>
      )}
      {actions.canClose && (
        <button type="button" className="pane-tool" title={t.closePane} onClick={actions.onClose}>
          <IconClose />
        </button>
      )}
    </div>
  )
}
