# Psters AI Workflow — Claude Code Plugin

> Documentação **específica** do plugin para Claude Code. Para o escopo geral (Cursor-first), veja o [`README.md`](./README.md) original. Este arquivo é complementar e foca em instalação, hooks, troubleshooting e configuração no Claude Code.

Plugin de fluxo de trabalho de IA estruturado para o [Claude Code](https://claude.com/claude-code), com 20 slash commands cobrindo o ciclo completo de desenvolvimento: brainstorming, planejamento, execução, revisão, documentação e deploy.

---

## Índice

1. [Instalação](#instalação)
2. [Configuração de Hooks](#configuração-de-hooks)
3. [Referência dos Comandos](#referência-dos-comandos)
4. [Workflow padrão](#workflow-padrão)
5. [Estrutura do plugin](#estrutura-do-plugin)
6. [Troubleshooting](#troubleshooting)
7. [Conventions](#conventions)

---

## Instalação

O plugin funciona em três modos de instalação. O Claude Code identifica o plugin pelo arquivo `.claude-plugin/plugin.json`.

### Modo 1: Via zip (mais simples)

1. Baixe a versão mais recente do plugin em zip do repositório.
2. Extraia em `~/.claude/plugins/marketplaces/local-desktop-app-uploads/psters-ai-workflow/`.
3. Reinicie o Claude Code ou rode `/reload-plugins`.

### Modo 2: Copiar para o projeto

```bash
# a partir da raiz do monorepo
cp -r plugins/psters-ai-workflow/.claude-plugin/. .claude/plugins/psters-ai-workflow/
cp -r plugins/psters-ai-workflow/{skills,agents,commands,rules,hooks,assets} \
      .claude/plugins/psters-ai-workflow/
```

### Modo 3: Script de instalação

```bash
node plugins/psters-ai-workflow/scripts/install-claude.mjs
```

### Verificando a instalação

Após reiniciar, rode `/pwf-help`. Se o plugin estiver carregado, os 20 comandos `pwf-*` aparecem.

---

## Configuração de Hooks

O plugin instala **4 hooks** automáticos no Claude Code. Eles ficam registrados em `hooks/hooks.claude.json` e são roteados por um único dispatcher (`hooks/dispatcher.mjs`) que consulta `hooks/config.json` para ligar/desligar individualmente.

### Hooks instalados

| Hook | Evento | Matcher | O que faz |
|---|---|---|---|
| `track-edit` | `PostToolUse` | `Edit\|Write\|MultiEdit` | Conta edições de código vs. docs por sessão (alimenta o doc-guard) |
| `migration-atomic-reminder` | `PostToolUse` | `Bash` | Avisa para rodar `drift-check` + executar localmente após `typeorm:generate` |
| `commit-convention-reminder` | `PreToolUse` | `Bash` | Lembra do prefixo `[TICKET-XXXX]` em `git commit` |
| `doc-guard-stop` | `Stop` | — | Ao encerrar a sessão, avisa se código foi editado mas nenhum doc foi atualizado |

### Como ativar/desativar um hook

Edite `hooks/config.json` (no repositório fonte **e** na instalação):

```json
{
  "hooks": {
    "track-edit": { "enabled": true },
    "migration-atomic-reminder": { "enabled": true },
    "commit-convention-reminder": { "enabled": false },
    "doc-guard-stop": { "enabled": true }
  }
}
```

Após editar, rode `/reload-plugins` no Claude Code. Hooks com `enabled: false` viram no-ops (saem com `{}` e exit 0, sem erro).

> **Dica:** Para desabilitar o reminder de commit sem editar JSON, defina `PSTERS_WORKFLOW_TELEMETRY_OPT_IN=false` no ambiente (também desliga a telemetria).

### Como funciona por dentro

```
Claude Code                       dispatcher.mjs                    inner hook
    │                                  │                                │
    ├── exec form: node                ├── lê config.json               │
    │   args: [dispatcher.mjs]         ├── verifica enabled             │
    │   env: PSTERS_HOOK_NAME=x        ├── fork() inner hook ──────────►│
    │                                  │   stdin: payload                ├── processa
    ├── stdin: hook payload ──────────►│   stdout: inherit              ├── emite JSON
    │                                  │                                ├── exit 0
    │                                  │◄────────────── exit code ───────┘
    │◄───── stdout: JSON do inner hook
```

O dispatcher **garante que apenas 1 hook por matcher seja registrado** no JSON, evitando a duplicação que causava `MODULE_NOT_FOUND` no Windows.

---

## Referência dos Comandos

Todos os comandos começam com `/pwf-` e estão documentados em `skills/<comando>/SKILL.md`.

| Comando | Propósito |
|---|---|
| `/pwf-help` | Explica todos os comandos e o caminho de workflow |
| `/pwf-setup` | Inicializa ou repara a estrutura de docs do workflow |
| `/pwf-setup-workspace` | Cria layout multi-repo `*_Repos` + `*_Workspace` |
| `/pwf-brainstorm` | Explora ideia, escopo e opções de arquitetura |
| `/pwf-plan` | Converte contexto em fases/tarefas executáveis |
| `/pwf-clarify` | Resolve ambiguidade antes da execução (opcional) |
| `/pwf-checklist` | Gera gates de qualidade de requisitos (opcional) |
| `/pwf-analyze` | Análise de consistência read-only (opcional) |
| `/pwf-work-plan` | Executa uma fase planejada |
| `/pwf-work` | Implementação focada fora de um plano formal |
| `/pwf-work-light` | Caminho rápido para mudanças triviais/locais |
| `/pwf-work-tdd` | Execução tests-first quando explicitamente solicitado |
| `/pwf-review` | Passada de revisão multi-agente |
| `/pwf-doc` | Força atualização da documentação técnica canônica |
| `/pwf-doc-foundation` | Cria/atualiza baseline de docs do projeto |
| `/pwf-doc-runbook` | Cria/atualiza runbooks operacionais |
| `/pwf-doc-capture` | Registra aprendizados e padrões reutilizáveis |
| `/pwf-doc-refresh` | Curadoria/ciclo de vida de `docs/solutions/` |
| `/pwf-commit-changes` | Cria commits estruturados com ticket |
| `/pwf-aws-lambda-deploy` | Deploy de Lambda com fluxo de script guardado |

---

## Workflow padrão

```
/pwf-brainstorm → /pwf-plan → /pwf-work-plan (repetir por fase)
                                  ↓
                              /pwf-review
                                  ↓
                          /pwf-commit-changes
```

Comandos opcionais que aparecem em pontos específicos:
- `/pwf-clarify` antes de `/pwf-plan` (resolver ambiguidade)
- `/pwf-checklist` ou `/pwf-analyze` antes de `/pwf-work-plan` (gates de qualidade)
- `/pwf-doc*` em qualquer momento (atualizar docs)

---

## Estrutura do plugin

```
plugins/psters-ai-workflow/
├── .claude-plugin/
│   └── plugin.json              # manifesto do plugin Claude Code
├── skills/
│   ├── pwf-*/SKILL.md           # um skill por comando /pwf-* (20)
│   └── */SKILL.md               # skills compartilhados reutilizáveis
├── agents/
│   ├── research/                # subagentes de pesquisa
│   ├── review/                  # subagentes de revisão
│   ├── docs/                    # subagentes de documentação
│   └── workflow/                # subagentes de orquestração
├── commands/
│   └── pwf-*.md                 # definições originais dos comandos
├── rules/
│   └── *.mdc                    # guardrails operacionais
├── hooks/
│   ├── hooks.claude.json        # config de hooks (Claude Code)
│   ├── dispatcher.mjs           # roteador único dos hooks
│   ├── config.json              # enable/disable por hook
│   ├── shared.mjs               # utilidades comuns
│   └── *.mjs                    # scripts de hook
├── assets/                      # templates e arquivos de apoio
├── CLAUDE.md                    # manifesto resumido (carregado pelo Claude)
├── CLAUDE_CODE_README.md        # este arquivo
└── README.md                    # README geral (Cursor-first, intocado)
```

---

## Troubleshooting

### "PostToolUse:Write hook error / Cannot find module '...\hooks\doc-guard-stop.mjs'"

**Causa:** Existe um `hooks.json` órfão (formato Cursor) no diretório `hooks/` que o runtime do Claude Code está lendo junto com `hooks.claude.json`. O formato Cursor usa `${CURSOR_PLUGIN_ROOT}` (não expandido no Claude Code) em shell form, causando `MODULE_NOT_FOUND` em `C:\Program Files\Git\hooks\`.

**Solução:**
1. Renomeie `hooks/hooks.json` para `hooks/hooks.cursor.json.disabled` (ou remova-o).
2. Verifique se `hooks/hooks.claude.json` está em **exec form** (com `command: "node"` e `args`), conforme a [doc oficial](https://code.claude.com/docs/en/hooks).
3. Rode `/reload-plugins`.

A partir da versão 1.0.2, o plugin usa um dispatcher único, o que **impede** essa duplicação estruturalmente.

### "2 stop hooks" aparecem nos logs

**Causa:** Mesmo problema acima — o `hooks.json` órfão registra um segundo conjunto de hooks. O dispatcher corrige isso.

### Hooks não disparam

1. Rode `/reload-plugins` após qualquer mudança em `hooks/config.json` ou `hooks/hooks.claude.json`.
2. Verifique se `~/.claude/plugins/marketplaces/local-desktop-app-uploads/psters-ai-workflow/hooks/` tem os mesmos arquivos do repositório fonte.
3. Use a skill `update-config` para inspecionar `settings.json` do Claude Code.

### State file não é criado

O `state` é gravado em `<plugin>/.cursor/hooks/state/psters-ai-workflow.json`. Se a sessão nunca editou código, o arquivo pode não existir (é lazy). Para forçar inicialização, faça um `Edit` ou `Write` e verifique o arquivo.

### Telemetria

A telemetria é opt-in. Para desligar completamente:

```bash
export PSTERS_WORKFLOW_TELEMETRY_OPT_IN=false
```

(Equivalente a `setx PSTERS_WORKFLOW_TELEMETRY_OPT_IN false` no Windows.)

---

## Conventions

- Comandos seguem `rules/operational-guardrails.mdc`.
- Commits seguem o formato de `rules/commits.mdc`: `[TICKET-XXXX] type(scope): subject`.
- Todos os comandos de trabalho (`/pwf-work`, `/pwf-work-plan`) atualizam docs como parte do workflow.
- Agentes de pesquisa são sempre spawnados em paralelo via Agent tool.
- **Sem** `git add -A` em bulk — sempre stage explícito por grupo de commit.
- Hooks em **exec form** (`command` + `args`) — única forma portátil no Windows.

---

## Compatibilidade

| Item | Versão / Status |
|---|---|
| Claude Code | ≥ 1.0 |
| Node.js | ≥ 18 (testado em 22.21) |
| Windows | ✅ testado (Git Bash + PowerShell) |
| macOS / Linux | ✅ testado |
| Plugin version | veja `.claude-plugin/plugin.json` |

---

## Suporte

- Issues: <https://github.com/gercyc/Psters_AI_Workflow/issues>
- Para questões específicas do Claude Code hooks, consulte <https://code.claude.com/docs/en/hooks>.
