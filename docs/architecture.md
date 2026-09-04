# Notes — arquitetura

Electron 39 + React 19 + Tiptap 3 + SQLite (`node:sqlite`, FTS5). Sem servidor, sem
conta; tudo em `app.getPath('userData')`: `notes.db` + `files/<projectId>/`.

## Processos

- `src/main/` — processo principal. `db.ts` (schema, migrações, CRUD, FTS),
  `files.ts` (anexos e imagens em disco), `content.ts` (texto plano e tarefas a
  partir do JSON do Tiptap), `seed.ts` (dados para screenshots), `index.ts`
  (janela, IPC, protocolo `notes-file://`, modo screenshot).
- `src/preload/index.ts` — `window.api`, única ponte para o renderer.
- `src/shared/types.ts` — tipos trafegados pelo IPC.
- `src/renderer/src/` — React.

## Renderer

```
main.tsx            monta <SettingsProvider><App/></SettingsProvider>
App.tsx             shell: árvore de projetos, estado do workspace, diálogos
workspace.ts        estado puro do split view (1–2 painéis), sem React
settings.tsx        provider (tema + idioma, localStorage)
settings-context.ts useSettings()
i18n*.ts            textos: núcleo / sidebar / editor
theme.ts            temas
components/
  Sidebar.tsx       projetos e notas, busca, drag para reordenar
  Workspace.tsx     renderiza os painéis; define PaneActions
  PaneToolbar.tsx   dividir / fechar painel
  ProjectPane.tsx   título, descrição, anexos do projeto
  NotePane.tsx      título, menu, editor, anexos da nota
  NoteEditor.tsx    Tiptap: toolbar, menus, tabelas, imagens
  Attachments.tsx   lista de anexos com drop
  NameDialog.tsx    criar / confirmar
  SettingsDialog.tsx
editor/
  setup.ts          extensões do Tiptap (também usadas nos testes headless)
assets/
  main.css          só @import
  tokens.css        variáveis de tema e reset
  layout.css        casca, split, vazio
  sidebar.css
  pane.css
  editor.css
  dialogs.css
```

## Contratos importantes

- **Ordem de notas**: `notes.position` por projeto. Nova nota entra em `0` e as
  outras descem. `api.notes.reorder(projectId, idsNaOrdem)` persiste a ordem inteira.
  `App.reorderNotes` faz update otimista da árvore e recarrega.
- **Split view**: `Workspace = { panes: Selection[], active }`. A sidebar age
  sobre o painel ativo; Alt/Ctrl+clique ou botão do meio abre ao lado. A mesma
  nota nunca abre em dois painéis. Depois de apagar algo, `dropDeleted`/`pruneAgainstTree`
  limpam seleções órfãs.
- **Imagens do editor**: nunca base64 no documento. `api.images.saveDataUrl` /
  `saveFiles` / `pick` gravam o arquivo em `files/<projectId>/` como anexo
  `inline=1` (fora da lista de anexos e da busca) e devolvem
  `notes-file://attachment/<id>`, servido por `protocol.handle` no main.
  CSP do `index.html` permite `img-src notes-file:`.
- **Apagar**: `notes.delete` remove arquivos da nota antes de apagar a linha;
  `projects.delete` remove a pasta inteira.
- **Salvamento**: o editor faz debounce de 350ms e grava o pendente ao desmontar.
  `NotePane` mantém `note.bodyJson` atualizado para remontagens.
- **`get` pode devolver `null`** (item apagado em outro painel). Tratar sempre.

## Testes

`npm test` roda `tests/e2e/*.test.mjs` com Node test runner: SQLite real em pasta
temporária + Tiptap headless em jsdom (`tests/e2e/dom.mjs`). Sem janela.
Importam TypeScript direto via loader (`tests/e2e/ts-hooks.mjs`).

## Screenshots reais

`npm run build && npm run shots [cena...]` → `docs/shots/<cena>.png`. Sobe o
Electron offscreen com banco temporário semeado (`seed.ts`). Cenas: `home`,
`project`, `note`, `split`, `settings`. Novas cenas: tratar em `App.tsx`
(efeito `app.info`) e semear o conteúdo em `seed.ts`.
