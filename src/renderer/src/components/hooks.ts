import { useEffect, useRef } from 'react'

/** Ref sempre apontando para o valor mais recente (atualizada após cada render). */
export function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}

/**
 * Chama a versão mais recente de `flush` quando o componente desmonta.
 * Usado para gravar título/descrição pendentes quando o painel fecha sem blur.
 */
export function useUnmountFlush(flush: () => void): void {
  const latest = useLatest(flush)
  useEffect(() => () => latest.current(), [latest])
}

/* localStorage pode estar indisponível (perfil bloqueado); nunca deixar isso derrubar a UI. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // sem armazenamento: segue sem persistir
  }
}
