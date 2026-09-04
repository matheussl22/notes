import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { useSettings } from '../settings-context'

/**
 * Bloco de código com rótulo de linguagem opcional (só texto, sem highlight).
 * O input fica no canto superior direito e aparece no hover ou quando preenchido.
 */
export function CodeBlockView({
  node,
  updateAttributes,
  editor
}: ReactNodeViewProps): React.JSX.Element {
  const { t } = useSettings()
  const language = (node.attrs.language as string | null) ?? ''
  return (
    <NodeViewWrapper className={`code-block${language ? ' has-lang' : ''}`}>
      {editor.isEditable && (
        <input
          className="code-lang"
          value={language}
          placeholder={t.codeLanguage}
          spellCheck={false}
          contentEditable={false}
          onChange={(event) => updateAttributes({ language: event.target.value.trim() || null })}
        />
      )}
      <pre>
        <NodeViewContent<'code'> as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
