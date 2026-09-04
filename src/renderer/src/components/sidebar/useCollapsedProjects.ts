/**
 * Projetos recolhidos na árvore. Persistido em localStorage como lista de ids;
 * ids de projetos que não existem mais são descartados quando a árvore chega.
 */
import { useCallback, useEffect, useState } from 'react'
import { readCollapsed, writeCollapsed } from './storage'

export type CollapsedProjects = {
  collapsed: ReadonlySet<number>
  isCollapsed: (id: number) => boolean
  toggle: (id: number) => void
  expand: (id: number) => void
  collapse: (id: number) => void
}

export function useCollapsedProjects(projectIds: readonly number[]): CollapsedProjects {
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(() => new Set(readCollapsed()))

  useEffect(() => {
    writeCollapsed(collapsed)
  }, [collapsed])

  // limpa ids órfãos (projeto apagado); a árvore vazia do boot não conta
  useEffect(() => {
    if (projectIds.length === 0) return
    setCollapsed((current) => {
      const alive = new Set(projectIds)
      const kept = [...current].filter((id) => alive.has(id))
      return kept.length === current.size ? current : new Set(kept)
    })
  }, [projectIds])

  const update = useCallback((id: number, next: boolean) => {
    setCollapsed((current) => {
      if (current.has(id) === next) return current
      const copy = new Set(current)
      if (next) copy.add(id)
      else copy.delete(id)
      return copy
    })
  }, [])

  const expand = useCallback((id: number) => update(id, false), [update])
  const collapse = useCallback((id: number) => update(id, true), [update])
  const toggle = useCallback(
    (id: number) => {
      setCollapsed((current) => {
        const copy = new Set(current)
        if (copy.has(id)) copy.delete(id)
        else copy.add(id)
        return copy
      })
    },
    [setCollapsed]
  )
  const isCollapsed = useCallback((id: number) => collapsed.has(id), [collapsed])

  return { collapsed, isCollapsed, toggle, expand, collapse }
}
