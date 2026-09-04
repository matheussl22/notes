/**
 * Captura telas reais do app, sem interação, para revisão visual.
 *
 *   npm run shots                       # build + todas as cenas em docs/shots/
 *   npm run shots -- note split         # só algumas cenas
 *   SHOT_THEME=night SHOT_LOCALE=en npm run shots
 *   SHOT_OUT=out-editor SHOT_DIR=docs/shots-editor npm run shots
 *
 * Faz `electron-vite build --outDir <SHOT_OUT>` (sem typecheck) e, para cada
 * cena, sobe o Electron offscreen com um banco temporário semeado
 * (src/main/seed.ts) e grava <SHOT_DIR>/<cena>[-<tema>][-<idioma>].png.
 *
 * Use SHOT_OUT/SHOT_DIR próprios quando várias pessoas (ou agentes) capturarem
 * ao mesmo tempo, para não disputar a pasta out/.
 *
 * Cenas conhecidas pelo renderer (App.tsx): home, project, note, split, settings.
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const electron = require('electron')

const root = resolve(import.meta.dirname, '..')
const outName = process.env.SHOT_OUT || 'out'
const outDir = resolve(root, outName)
const shotDir = resolve(root, process.env.SHOT_DIR || 'docs/shots')
const theme = process.env.SHOT_THEME || ''
const locale = process.env.SHOT_LOCALE || ''
const scenes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['home', 'project', 'note', 'split', 'settings']

function run(command, args, env = {}) {
  return new Promise((done) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'inherit', 'pipe'],
      shell: process.platform === 'win32' && command !== electron,
      env: { ...process.env, ...env }
    })
    child.stderr.on('data', (chunk) => {
      const text = String(chunk)
      // o aviso do SQLite experimental só faz barulho
      if (/ExperimentalWarning|trace-warnings/.test(text)) return
      process.stderr.write(text)
    })
    const timer = setTimeout(() => {
      console.error(`"${command} ${args.join(' ')}" travou; matando`)
      child.kill()
    }, 120_000)
    child.on('exit', (code) => {
      clearTimeout(timer)
      done(code ?? 1)
    })
  })
}

if (process.env.SHOT_SKIP_BUILD !== '1') {
  const code = await run('npx', ['electron-vite', 'build', '--outDir', outName])
  if (code !== 0) {
    console.error('build falhou')
    process.exit(code)
  }
}

mkdirSync(shotDir, { recursive: true })

for (const scene of scenes) {
  const suffix = [theme, locale]
    .filter(Boolean)
    .map((part) => `-${part}`)
    .join('')
  const code = await run(electron, [resolve(outDir, 'main', 'index.js')], {
    NOTES_SHOT_DIR: shotDir,
    NOTES_SHOT_SCENE: scene,
    NOTES_SHOT_NAME: `${scene}${suffix}`,
    NOTES_SHOT_THEME: theme,
    NOTES_SHOT_LOCALE: locale
  })
  console.log(`${code === 0 ? 'ok ' : 'ERR'} ${resolve(shotDir, `${scene}${suffix}.png`)}`)
}
