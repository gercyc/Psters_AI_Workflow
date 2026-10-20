# Psters AI Workflow — GitHub Copilot Plugin

> Documentação **específica** do plugin para o [GitHub Copilot CLI](https://docs.github.com/en/copilot/concepts/agents/about-plugins). Para Claude Code, veja [`CLAUDE_CODE_README.md`](./CLAUDE_CODE_README.md). Este arquivo foca em instalação, o que é compatível e como a camada de compatibilidade funciona.

---

## Instalação

Este repositório já é um marketplace de plugins. O Copilot CLI lê o mesmo `.claude-plugin/marketplace.json` da raiz que o Claude Code usa, então o comando de instalação é o mesmo nome `plugin@marketplace`:

```bash
copilot plugin marketplace add gercyc/Psters_AI_Workflow
copilot plugin install psters-ai-workflow@psters-marketplace
```

Ou, dentro de uma sessão interativa:

```
/plugin marketplace add gercyc/Psters_AI_Workflow
/plugin install psters-ai-workflow@psters-marketplace
```

Atualizar após um novo release (versão incrementada e mergeada na `main`):

```bash
copilot plugin update psters-ai-workflow
```

### Desenvolvimento local

Apontar o marketplace para um clone local carrega o plugin "ao vivo", sem copiar arquivos — edições valem na próxima sessão:

```bash
copilot plugin marketplace add /caminho/para/Psters_AI_Workflow
copilot plugin install psters-ai-workflow@psters-marketplace
```

### Verificando a instalação

```bash
copilot plugin list      # psters-ai-workflow@psters-marketplace (enabled)
copilot mcp list         # context7 (local) em "Plugin servers"
```

Em uma sessão: `/skills list` mostra as skills `pwf-*`, e `/agent` lista os agentes `psters-ai-workflow:*`.

### Para o Copilot cloud agent (repositório)

Segundo a [documentação](https://docs.github.com/en/copilot/concepts/agents/about-plugins), o cloud agent usa `extraKnownMarketplaces` + `enabledPlugins` no `.github/copilot/settings.json` do repositório que vai usar o plugin. O formato de `extraKnownMarketplaces` abaixo foi validado no Copilot CLI 1.0.100; a ativação automática via `enabledPlugins` não foi testada no cloud agent.

```json
{
  "extraKnownMarketplaces": {
    "psters-marketplace": { "source": { "source": "github", "repo": "gercyc/Psters_AI_Workflow" } }
  },
  "enabledPlugins": { "psters-ai-workflow@psters-marketplace": true }
}
```

---

## O que é compatível

| Componente | Claude Code | GitHub Copilot | Observação |
|---|---|---|---|
| Skills (`skills/*/SKILL.md`) — 38, incluindo os 20 `pwf-*` | ✅ | ✅ | Mesmos arquivos, sem cópia |
| Agentes (`agents/**/*.md`) — 45 | ✅ | ✅ | Expostos como `psters-ai-workflow:<nome>` |
| MCP `context7` (`mcp.json`) | — | ✅ | |
| Hooks (4) | ✅ `hooks.claude.json` | ✅ `hooks.copilot.json` | Mesmos scripts, via `dispatcher.mjs` |
| Slash commands (`commands/*.md`) | ✅ | ➖ | No Copilot, cada comando já existe como skill de mesmo nome |
| Rules (`rules/*.mdc`) | ➖ | ➖ | Formato Cursor |

---

## Como a camada de compatibilidade funciona

### Manifesto

`/.github/plugin/plugin.json` é o manifesto do Copilot. Na ordem de busca do Copilot CLI ele tem precedência sobre `.claude-plugin/plugin.json`, e o Claude Code o ignora. Assim cada cliente lê o seu:

| Arquivo | Lido por |
|---|---|
| `.claude-plugin/plugin.json` | Claude Code |
| `.github/plugin/plugin.json` | GitHub Copilot |
| `.cursor-plugin/plugin.json` | Cursor |
| `../../.claude-plugin/marketplace.json` | Claude Code **e** GitHub Copilot |

O manifesto Copilot lista os agentes explicitamente: o Copilot não varre subpastas de `agents/`. A lista precisa ficar igual à do manifesto Claude — o teste `tests/manifests/copilot-manifest.test.mjs` garante isso.

### Hooks

O Copilot usa um formato próprio (`version: 1`, eventos camelCase, payload `toolName`/`toolArgs`). O formato Claude com `command` + `args` usado em `hooks.claude.json` **não** dispara no Copilot, então existe um arquivo dedicado, `hooks/hooks.copilot.json`, que chama o mesmo `dispatcher.mjs`.

| Hook | Claude Code | GitHub Copilot | Saída no Copilot |
|---|---|---|---|
| `track-edit` | `PostToolUse` `Edit\|Write\|MultiEdit` | `postToolUse` (`edit`, `create`) | — |
| `migration-atomic-reminder` | `PostToolUse` `Bash` | `postToolUse` (`bash`, `powershell`) | `additionalContext` |
| `commit-convention-reminder` | `PreToolUse` `Bash` | `postToolUse` (`bash`, `powershell`) | `additionalContext` |
| `doc-guard-stop` | `Stop` | `agentStop` | `decision: "block"` + `reason` (uma vez por sessão) |

Detalhes:

- `dispatcher.mjs` normaliza os payloads de Cursor, Claude Code e Copilot para um formato único antes de chamar o hook.
- `PSTERS_TOOL_MATCH` filtra por nome de ferramenta no dispatcher, porque eventos camelCase do Copilot disparam para qualquer ferramenta.
- `PSTERS_HOOK_CLIENT=copilot` faz os hooks responderem no formato do Copilot. Lembretes viram `additionalContext`, que o modelo realmente lê; no Claude Code continuam indo para stderr.
- O lembrete de commit roda **depois** do comando no Copilot. Um `preToolUse` que falha bloqueia a ferramenta, então ele não é usado para um aviso.
- Ligar/desligar hooks continua em `hooks/config.json`, igual ao Claude Code.

### Versão

`scripts/bump-version.mjs` atualiza todos os `plugin.json` (Claude Code, Copilot e Codex) e o `marketplace.json` juntos, e recusa rodar se estiverem divergentes.

---

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| Plugin instalado mas sem agentes | Instalação antiga em cache | `copilot plugin update psters-ai-workflow` ou reinstalar |
| Hooks não disparam | Pasta não confiável ou `node` fora do PATH | Confie na pasta ao iniciar a sessão; confirme `node --version` |
| `context7` não aparece | `npx` indisponível | Instale Node.js (inclui `npx`) |
| Aviso "Direct plugin installs are deprecated" | Instalação por caminho/URL direto | Use `psters-ai-workflow@psters-marketplace` |
