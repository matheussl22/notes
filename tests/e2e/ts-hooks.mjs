import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const TS_SUFFIXES = ['.ts', '/index.ts']

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      for (const suffix of TS_SUFFIXES) {
        try {
          return await nextResolve(`${specifier}${suffix}`, context)
        } catch {
          // tenta o próximo sufixo
        }
      }
    }
    throw error
  }
}

export async function load(url, context, nextLoad) {
  if (!url.endsWith('.ts')) {
    return nextLoad(url, context)
  }

  const source = await readFile(fileURLToPath(url), 'utf8')
  const result = ts.transpileModule(source, {
    fileName: fileURLToPath(url),
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      isolatedModules: true,
      esModuleInterop: true,
      skipLibCheck: true
    }
  })

  return {
    format: 'module',
    source: result.outputText,
    shortCircuit: true
  }
}
