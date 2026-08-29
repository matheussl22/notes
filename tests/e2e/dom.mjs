import { JSDOM } from 'jsdom'

export function ensureDom() {
  if (globalThis.document) return

  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/'
  })

  const { window } = dom
  Object.defineProperty(globalThis, 'window', { configurable: true, value: window })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: window.document })
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: window.navigator })
  Object.defineProperty(globalThis, 'Node', { configurable: true, value: window.Node })
  Object.defineProperty(globalThis, 'DOMParser', { configurable: true, value: window.DOMParser })
  Object.defineProperty(globalThis, 'MutationObserver', {
    configurable: true,
    value: window.MutationObserver
  })
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: window.getComputedStyle.bind(window)
  })
}
