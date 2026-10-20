# Psters AI Workflow — Codex (OpenAI) Plugin

> Documentação **específica** do plugin para o [Codex](https://developers.openai.com/plugins/build/plugins) (CLI e app desktop do ChatGPT). Para Claude Code veja [`CLAUDE_CODE_README.md`](./CLAUDE_CODE_README.md); para GitHub Copilot, [`COPILOT_README.md`](./COPILOT_README.md).

---

## Instalação

O Codex lê o mesmo `.claude-plugin/marketplace.json` da raiz deste repositório, então não há marketplace separado:

```bash
codex plugin marketplace add gercyc/Psters_AI_Workflow
codex plugin add psters-ai-workflow@psters-marketplace
```

No app desktop do ChatGPT, depois de adicionar o marketplace, o plugin aparece em **Plugins Directory → psters-marketplace**.

Atualizar após um novo release (versão incrementada e mergeada na `main`):

```bash
codex plugin marketplace upgrade psters-marketplace
```

### Desenvolvimento local

```bash
codex plugin marketplace add /caminho/para/Psters_AI_Workflow
codex plugin add psters-ai-workflow@psters-marketplace
```

O Codex instala uma cópia em `~/.codex/plugins/cache/psters-marketplace/psters-ai-workflow/<versão>/`. Depois de editar o plugin, rode `codex plugin add` de novo para atualizar a cópia.

### Habilitar por repositório

Em `.codex/config.toml` do projeto (carregado só em projetos confiáveis):

```toml
[plugins."psters-ai-workflow@psters-marketplace"]
enabled = true
```

### Confiar nos hooks

O Codex não roda hooks de plugin até você revisá-los e confiar neles. Na primeira sessão, abra `/hooks`, revise os 4 hooks `psters-ai-workflow` e confie neles. Uma mudança em `hooks/hooks.codex.json` exige revisar de novo.

### Verificando a instalação

```bash
codex plugin list        # psters-ai-workflow@psters-marketplace  installed
codex mcp list           # context7
```

---

## O que é compatível

| Componente | Claude Code | GitHub Copilot | Codex | Observação |
|---|---|---|---|---|
| Skills (`skills/*/SKILL.md`) — 38, incluindo os 20 `pwf-*` | ✅ | ✅ | ✅ | Mesmos arquivos |
| Agentes (`agents/**/*.md`) — 45 | ✅ | ✅ | ⚠️ via skill `psters-agents` | Plugins do Codex não registram agentes |
| MCP `context7` (`mcp.json`) | — | ✅ | ✅ | |
| Hooks (4) | ✅ | ✅ | ✅ `hooks.codex.json` | Exigem confiança em `/hooks` |
| Slash commands (`commands/*.md`) | ✅ | ➖ | ➖ | Cada comando já existe como skill de mesmo nome |
| Rules (`rules/*.mdc`) | ➖ | ➖ | ➖ | Formato Cursor |

---

## Como a camada de compatibilidade funciona

### Manifesto

`.codex-plugin/plugin.json` é o manifesto do Codex. Claude Code e Copilot não o leem.

| Arquivo | Lido por |
|---|---|
| `.claude-plugin/plugin.json` | Claude Code |
| `.github/plugin/plugin.json` | GitHub Copilot |
| `.codex-plugin/plugin.json` | Codex |
| `.cursor-plugin/plugin.json` | Cursor |
| `../../.claude-plugin/marketplace.json` | Claude Code, GitHub Copilot e Codex |

Por que não um `plugin.json` na raiz do plugin (formato portátil Agent Plugins)? O Copilot daria prioridade a esse arquivo sobre `.github/plugin/plugin.json` e perderia agentes e hooks.

Pontos do manifesto:

- `"commands": []` desliga a migração automática que o Codex faz de `commands/` para skills. Sem isso ele cria skills duplicadas `source-command-pwf-*`.
- `skills` inclui `./codex/skills/`, onde fica a skill `psters-agents`, visível só no Codex.

### Agentes

As skills `pwf-*` mandam disparar agentes nomeados (ex.: `repo-research-analyst`), mas plugins do Codex não registram agentes. A skill `psters-agents` ensina o Codex a ler `agents/<categoria>/<nome>.md` e usar o conteúdo como instrução de um subagente, ou a executar inline se subagentes não estiverem disponíveis.

### Hooks

O Codex usa o formato de hooks do Claude Code (eventos PascalCase, `matcher`, payload `session_id`/`tool_name`/`tool_input`), mas o handler não tem campo `env`. Por isso `hooks/hooks.codex.json` passa o nome do hook e o cliente como argumentos: `node "${PLUGIN_ROOT}/hooks/dispatcher.mjs" <hook> codex`. O Codex expande `${PLUGIN_ROOT}` para o caminho absoluto do plugin.

| Hook | Evento Codex | Matcher | Saída |
|---|---|---|---|
| `commit-convention-reminder` | `PreToolUse` | `Bash` | `hookSpecificOutput.additionalContext` |
| `track-edit` | `PostToolUse` | `Edit\|Write` (`apply_patch`) | — |
| `migration-atomic-reminder` | `PostToolUse` | `Bash` | `hookSpecificOutput.additionalContext` |
| `doc-guard-stop` | `Stop` | — | `decision: "block"` + `reason` (uma vez por sessão) |

Detalhes:

- Edições no Codex chegam como `apply_patch`, com o patch em `tool_input.command`. O dispatcher extrai todos os arquivos do patch (`*** Add/Update/Delete File:`), então um patch com vários arquivos conta cada um.
- Comandos de shell que chegam como array (`["bash", "-lc", "..."]`) são unidos antes da checagem.
- Ligar/desligar hooks continua em `hooks/config.json`.

### Versão

`scripts/bump-version.mjs` atualiza os três `plugin.json` e o `marketplace.json` juntos.

---

## Como foi validado

Sem conta Codex, a validação usou o Codex CLI 0.163.0 sem login:

- `codex plugin marketplace add` + `codex plugin add` a partir deste repositório.
- `codex debug prompt-input`: as 39 skills (38 + `psters-agents`) aparecem no prompt do modelo, sem duplicatas `source-command-*`.
- `codex mcp list`: `context7` habilitado.
- `hooks/list` do `codex app-server`: os 4 hooks carregados com matcher, timeout e `${PLUGIN_ROOT}` expandido.
- Os comandos exatos retornados pelo `hooks/list` foram executados com payloads no formato documentado do Codex, e os testes em `tests/hooks/` cobrem os mesmos cenários.

**Não validado:** uma sessão real (o modelo recebendo o `additionalContext`, o `Stop` gerando a continuação, o modelo seguindo a skill `psters-agents`).

---

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| Hooks não disparam | Hooks ainda não confiados | Abra `/hooks` e confie nos hooks `psters-ai-workflow` |
| Hooks não disparam após update | O hash mudou, e o Codex pede nova revisão | Revise de novo em `/hooks` |
| Skills `source-command-pwf-*` aparecem | Manifesto antigo sem `"commands": []` | Atualize o plugin |
| `context7` não aparece | `npx` indisponível | Instale Node.js (inclui `npx`) |
