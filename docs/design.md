# Notes — guia de design

Referência obrigatória para qualquer mudança visual. O objetivo é um app que pareça
uma ferramenta nativa bem feita (Things, Bear, Obsidian, Jira no que tem de bom),
não uma landing page. Denso, quieto, previsível.

## Princípios

1. **Conteúdo primeiro.** A nota ocupa o máximo de área. Cromo (barras, botões) é
   pequeno, cinza, e aparece no hover quando não é essencial.
2. **Quieto.** Uma cor de destaque (`--accent`) usada com parcimônia: seleção ativa,
   foco, link, botão primário. Nada mais é colorido. Sem gradientes, sem
   glassmorphism, sem sombras coloridas, sem emojis na interface, sem ilustrações.
3. **Denso e alinhado.** Grade de 4px. Linhas da sidebar têm 24px (projetos) /
   24px (notas). Ícones 14–16px, traço 1.5. Texto de UI 13px, secundário 12px,
   rótulos em caixa alta 11px com `letter-spacing: 0.06em`.
4. **Bordas, não caixas.** Separar áreas com `1px solid var(--line)`, não com cards
   flutuantes. Raio máximo 7px em controles, 12px só em modais.
5. **Movimento mínimo.** Transições só em `opacity`/`background`, 120ms, `ease-out`.
   Nunca animar layout.
6. **Texto de verdade.** Sem placeholders genéricos ("Lorem", "Digite algo…").
   Rótulos curtos, em pt-BR primeiro, sempre traduzidos nos três idiomas.
7. **Escuro de verdade.** Tema `night` precisa ser confortável: superfícies em camadas
   (`--bg` < `--sidebar` < `--panel`), texto `--text` nunca branco puro.

## Tokens (assets/tokens.css)

Use **somente** variáveis. Nunca hexadecimal solto fora de `tokens.css`.

| Token            | Uso                                              |
| ---------------- | ------------------------------------------------ |
| `--bg`           | fundo da janela                                  |
| `--sidebar`      | fundo da barra lateral                           |
| `--panel`        | fundo do painel de conteúdo, popovers, modais    |
| `--line`         | divisórias e bordas sutis                        |
| `--line-strong`  | bordas de campos, alças, redimensionadores       |
| `--text`         | texto principal                                  |
| `--text-soft`    | texto de notas na sidebar, corpo secundário      |
| `--muted`        | rótulos, ícones inativos, placeholders           |
| `--accent`       | seleção, links, botão primário                   |
| `--accent-ink`   | hover do accent, texto sobre `--accent-soft`     |
| `--accent-soft`  | fundo de item ativo na toolbar, drop zone        |
| `--danger*`      | apagar                                           |
| `--sel`          | fundo de item selecionado na sidebar             |
| `--hover`        | hover de linhas e botões fantasma                |
| `--field`        | fundo de campos de busca/entrada na sidebar      |
| `--code-bg`      | fundo de código e células de cabeçalho de tabela |
| `--r-sm/md/lg`   | 4 / 7 / 12 px                                    |
| `--shadow-pop`   | popovers e modais                                |
| `--font-ui/mono` | pilhas tipográficas                              |

## Tipografia

- UI: 13px / 1.4. Títulos de nota/projeto: 26–30px, peso 600, `letter-spacing -0.02em`.
- Documento (editor): 15–16px / 1.7. H1 24px, H2 20px, H3 16px, todos peso 600.
- Código: `--font-mono`, 13px, fundo `--code-bg`, raio `--r-sm`.
- Nunca usar peso 700+ nem itálico decorativo.

## Componentes

- **Botão fantasma** (padrão): sem borda, fundo transparente, `--muted`; hover
  `--hover` + `--text`. Tamanho 24–28px quadrado para ícones.
- **Botão primário**: `--accent` com texto branco, 32px de altura, só em modais.
- **Popover/menu**: `--panel`, borda `--line`, `--shadow-pop`, raio `--r-md`,
  itens de 28px.
- **Campo de texto**: fundo `--field` na sidebar, borda `--line-strong` em modais.
- **Estado ativo em toolbar**: fundo `--accent-soft`, ícone `--accent-ink`.
- **Arrastar**: item arrastado a 45% de opacidade; alvo indicado por uma linha
  de 2px em `--accent` (acima ou abaixo), nunca por mudar o fundo do alvo.

## Anti-padrões (não fazer)

- Cards com sombra para tudo; bordas de 1px bastam.
- Botões gigantes com texto + ícone quando um ícone com `title` resolve.
- Cores por categoria, badges coloridos, gradientes, emojis.
- Textos "amigáveis" e exclamativos. Estado vazio: uma frase curta em `--muted`.
- Tipografia decorativa (serifas para títulos, display fonts).
