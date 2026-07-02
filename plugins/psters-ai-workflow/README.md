
## Support Scope

- Primary and official focus: **Cursor**
- Supported fallback: **Claude Code** (via `node scripts/install-workflow-bridge.mjs --to claude --project <path>`)
- Other editors are not an official support target for this plugin


### Included

- **rules/**: commit conventions, markdown discipline, TypeORM migrations, Context7 documentation
- **skills/**: commit orchestration, per-repo commit worker, NestJS/Angular conventions, AWS Lambda deploy, verification-before-completion, systematic-debugging (+ debug artifacts), using-psters-workflow, orchestrating-multi-agents, requesting-code-review, receiving-code-review, finishing-a-development-branch, test-driven-development (opt-in), git-worktree, ai-memory-usage (optional long-term memory over MCP)
- **agents/**: full workflow agents — review (simplicity, security, architecture, schema-drift, performance, etc.), design, docs, research, workflow
- **commands/**: `pwf-help`, `pwf-setup`, `pwf-setup-workspace`, `pwf-brainstorm`, `pwf-plan`, `pwf-clarify`, `pwf-checklist`, `pwf-analyze`, `pwf-work-plan`, `pwf-work`, `pwf-work-light`, `pwf-work-tdd`, `pwf-review`, `pwf-doc`, `pwf-doc-foundation`, `pwf-doc-runbook`, `pwf-doc-capture`, `pwf-doc-refresh`, `pwf-aws-lambda-deploy`, `pwf-commit-changes`
- **presets/**: workflow presets (`general`, `nestjs-api`, `angular-feature`, `lambda-pipeline`, `bugfix-hotfix`)
- **extensions/**: extension hook points (`before_plan`, `after_plan`, `before_work_plan`, `after_work_plan`, `before_work`, `after_work`)

### Docs scope boundary

- The repository-root `docs/` folder here documents the plugin itself.
- The `docs/` folder managed by `/pwf-setup`, `/pwf-work`, and `/pwf-work-plan` is the target project documentation.
- Keep these scopes separate to avoid mixing plugin docs with project operational docs.

### Anti-vibe coding

This plugin enforces:

- **Contextualization**: `/pwf-work` and `/pwf-work-plan` read docs first, never jump to implementation.
- **Documentation**: Both commands update docs as part of their mandatory workflow (doc-shepherd, module/feature/lambda docs).
- **Structure**: Phases, tasks, review loops, and commit conventions keep work traceable.

### Workflow

`/pwf-brainstorm` -> `/pwf-plan` -> `[optional by user decision: /pwf-clarify /pwf-checklist /pwf-analyze]` -> `/pwf-work-plan` (or `/pwf-work` / `/pwf-work-light`) -> `[/pwf-review on demand]` -> `/pwf-commit-changes`

### 30-second command chooser

Use this as a quick decision map. User chooses the path; the workflow does not auto-switch for you.

| If you need to... | Use |
| --- | --- |
| Get a full command and workflow walkthrough | `/pwf-help` |
| Initialize/repair workflow docs skeleton | `/pwf-setup` |
| Explore idea, scope, architecture options | `/pwf-brainstorm` |
| Turn context into executable tasks/phases | `/pwf-plan` |
| Remove ambiguity before execution | `/pwf-clarify` (optional, user decision) |
| Quality-gate requirements by domain | `/pwf-checklist` (optional, user decision) |
| Run read-only consistency checks | `/pwf-analyze` (optional, user decision) |
| Execute one planned phase | `/pwf-work-plan` |
| Execute direct/unplanned change | `/pwf-work` |
| Execute trivial local change with minimal overhead | `/pwf-work-light` |
| Execute tests-first flow (explicit request) | `/pwf-work-tdd` |
| Run heavy multi-agent review | `/pwf-review` (on-demand, intentionally heavy) |
| Build or refresh project foundation docs baseline | `/pwf-doc-foundation` |
| Create/update operational runbooks | `/pwf-doc-runbook` |
| Refresh stale `docs/solutions/` entries interactively | `/pwf-doc-refresh` |

### `/pwf-doc` family

- `/pwf-work`, `/pwf-work-plan`, `/pwf-work-light`, and `/pwf-work-tdd` already update docs as part of their workflow.
- `/pwf-doc`: explicitly force canonical system documentation generation/update (module, feature, architecture, ADR, full update).
- `/pwf-doc-foundation`: create/refresh baseline project docs (`infrastructure`, `architecture`, `integrations`, `environments`, `glossary`).
- `/pwf-doc-runbook`: create/refresh operational runbooks in `docs/runbooks/`.
- `/pwf-doc-capture`: explicitly force learning documentation (problem/solution writeups and reusable implementation patterns).
- `/pwf-doc-refresh`: interactively maintain `docs/solutions/` lifecycle (keep/update/replace/archive).

Use `/pwf-doc` for scoped technical docs, `/pwf-doc-foundation` for baseline project context, `/pwf-doc-runbook` for operations, and `/pwf-doc-capture` for reusable learnings.

> Important: `/pwf-doc` and `/pwf-doc-capture` complement work commands; they do not replace them.

### Hooks Automation

This plugin includes workflow hooks in `hooks/hooks.json` to reinforce anti-vibe-coding behavior:

- `afterFileEdit` -> tracks whether the session changed code and/or docs.
- `stop` -> reminds to run `/pwf-doc update` (and `/pwf-doc-capture` when relevant) if code changed without documentation updates.
- `beforeShellExecution` (matcher: `git commit`) -> reminds commit message convention (`[TICKET-XXXX] ...`).
- `afterShellExecution` (matcher: `typeorm:generate`) -> reminds the migration atomic chain.

Optional telemetry (opt-in only):

- Set `PSTERS_WORKFLOW_TELEMETRY_OPT_IN=true` to append local hook events to `.cursor/hooks/state/psters-ai-workflow-telemetry.jsonl`.
- Default is disabled.

### Usage Notes

- Keep commits focused and ticket-aware when possible.
- Use `/pwf-plan` for multi-step changes.
- Use `/pwf-work` for direct implementation requests.
- Use `/pwf-work-light` for trivial/local-only changes (<=2 files, no contract/schema impact).
- Use `/pwf-work-tdd` only when tests-first behavior is explicitly requested.
- Use `/pwf-review` before opening a pull request.
- **Never skip documentation** — `/pwf-work` and `/pwf-work-plan` update docs as part of the flow.

### Presets and extensions (current practical status)

- **Presets** (`presets/presets.json`): currently influence planning emphasis and review focus when `/pwf-plan` receives `preset:<name>`.
- **Extensions** (`extensions/extensions.json`): hook-point system is available, but only one extension is active by default (`after_plan` advisory).
- This is intentional: core workflow remains predictable, while extension points exist for gradual project-specific customization.

### Context7 MCP

This plugin includes `mcp.json` with a Context7 MCP server setup.

- Server key: `context7`
- Required flow: `resolve-library-id` -> `query-docs`
- Guidance rule: `rules/context7-documentation.mdc`

Use this flow whenever implementation depends on external library/framework docs.

---

<a id="plugin-explicado-portugues-pt-br"></a>

## Visão Geral do Plugin (Português - PT-BR)

Plugin de workflow diario de IA para Cursor. **Anti-vibe-coding** por design.

### Escopo de suporte

- Foco principal e oficial: **Cursor**
- Fallback suportado: **Claude Code** (via `node scripts/install-workflow-bridge.mjs --to claude --project <caminho>`)
- Outros editores nao sao alvo de suporte oficial deste plugin

### Instalacao

### Marketplace

Quando publicado, instale via [Cursor Marketplace](https://cursor.com/marketplace).

### Instalacao manual

1. Rode:
   - `./scripts/install-plugin-local.sh`
2. Reinicie o Cursor (ou recarregue a janela) para ativar.

Este plugin tambem esta registrado em `.cursor-plugin/marketplace.json` neste repositorio.

Para validar prontidao de submissao:

`node scripts/validate-template.mjs`

### O que esta incluido

- **rules/**: convencoes de commit, disciplina de markdown, migrations TypeORM, documentacao Context7, texto para usuario, AWS CLI
- **skills/**: orquestracao de commits, worker por repositorio, convencoes NestJS/Angular, deploy de AWS Lambda, verification-before-completion, systematic-debugging (+ artefatos de debug), using-psters-workflow, orchestrating-multi-agents, requesting-code-review, receiving-code-review, finishing-a-development-branch, test-driven-development (opt-in), git-worktree, ai-memory-usage (memoria de longo prazo opcional via MCP)
- **agents/**: suite completa de agentes — review (simplicidade, seguranca, arquitetura, schema-drift, performance etc.), design, docs, research, workflow
- **commands/**: `pwf-help`, `pwf-setup`, `pwf-setup-workspace`, `pwf-brainstorm`, `pwf-plan`, `pwf-clarify`, `pwf-checklist`, `pwf-analyze`, `pwf-work-plan`, `pwf-work`, `pwf-work-light`, `pwf-work-tdd`, `pwf-review`, `pwf-doc`, `pwf-doc-foundation`, `pwf-doc-runbook`, `pwf-doc-capture`, `pwf-doc-refresh`, `pwf-aws-lambda-deploy`, `pwf-commit-changes`
- **presets/**: presets de workflow (`general`, `nestjs-api`, `angular-feature`, `lambda-pipeline`, `bugfix-hotfix`)
- **extensions/**: hook points de extensao (`before_plan`, `after_plan`, `before_work_plan`, `after_work_plan`, `before_work`, `after_work`)

### Fronteira de escopo de docs

- A pasta `docs/` na raiz deste repositorio documenta o plugin.
- A pasta `docs/` gerenciada por `/pwf-setup`, `/pwf-work` e `/pwf-work-plan` e a documentacao do projeto alvo.
- Mantenha os escopos separados para nao misturar docs do plugin com docs operacionais do projeto.

### Anti-vibe coding

Este plugin reforca:

- **Contextualizacao**: `/pwf-work` e `/pwf-work-plan` leem docs primeiro, sem pular direto para implementacao.
- **Documentacao**: ambos os comandos atualizam docs como parte obrigatoria do fluxo (doc-shepherd, docs de modulo/feature/lambda).
- **Estrutura**: fases, tarefas, loops de review e convencoes de commit mantem rastreabilidade.

### Workflow

`/pwf-brainstorm` -> `/pwf-plan` -> `[opcional por decisao do usuario: /pwf-clarify /pwf-checklist /pwf-analyze]` -> `/pwf-work-plan` (ou `/pwf-work` / `/pwf-work-light`) -> `[/pwf-review sob demanda]` -> `/pwf-commit-changes`

### Mapa rapido de comandos (30 segundos)

Use como mapa de decisao rapido. Quem decide o caminho e o usuario; o workflow nao muda automaticamente por voce.

| Se voce precisa... | Use |
| --- | --- |
| Ver uma explicacao completa de comandos e fluxo | `/pwf-help` |
| Inicializar/reparar o esqueleto de docs do workflow | `/pwf-setup` |
| Explorar ideia, escopo e opcoes de arquitetura | `/pwf-brainstorm` |
| Transformar contexto em tarefas/fases executaveis | `/pwf-plan` |
| Remover ambiguidades antes de executar | `/pwf-clarify` (opcional, decisao do usuario) |
| Criar quality gate de requisitos por dominio | `/pwf-checklist` (opcional, decisao do usuario) |
| Rodar analise read-only de consistencia | `/pwf-analyze` (opcional, decisao do usuario) |
| Executar uma fase planejada | `/pwf-work-plan` |
| Executar mudanca direta/fora de plano | `/pwf-work` |
| Executar mudanca trivial local com menor overhead | `/pwf-work-light` |
| Executar fluxo tests-first (pedido explicito) | `/pwf-work-tdd` |
| Rodar review multi-agente pesado | `/pwf-review` (sob demanda, intencionalmente pesado) |
| Criar/atualizar baseline de docs do projeto | `/pwf-doc-foundation` |
| Criar/atualizar runbooks operacionais | `/pwf-doc-runbook` |
| Atualizar entradas antigas de `docs/solutions/` de forma interativa | `/pwf-doc-refresh` |

### Familia `/pwf-doc`

- `/pwf-work`, `/pwf-work-plan`, `/pwf-work-light` e `/pwf-work-tdd` ja atualizam docs como parte do fluxo.
- `/pwf-doc`: forca explicitamente geracao/atualizacao da documentacao canonica do sistema (modulo, feature, arquitetura, ADR, update geral).
- `/pwf-doc-foundation`: cria/atualiza baseline de docs do projeto (`infrastructure`, `architecture`, `integrations`, `environments`, `glossary`).
- `/pwf-doc-runbook`: cria/atualiza runbooks operacionais em `docs/runbooks/`.
- `/pwf-doc-capture`: forca explicitamente documentacao de aprendizado (problema/solucao e padroes reutilizaveis).
- `/pwf-doc-refresh`: mantem de forma interativa o ciclo de vida de `docs/solutions/` (keep/update/replace/archive).

Use `/pwf-doc` para docs tecnicas por escopo, `/pwf-doc-foundation` para contexto base do projeto, `/pwf-doc-runbook` para operacoes, e `/pwf-doc-capture` para aprendizado reutilizavel.

> Importante: `/pwf-doc` e `/pwf-doc-capture` complementam os comandos de trabalho; nao substituem esses comandos.

### Automacao com Hooks

Este plugin inclui hooks em `hooks/hooks.json` para reforcar anti-vibe-coding:

- `afterFileEdit` -> rastreia se a sessao alterou codigo e/ou docs.
- `stop` -> lembra de rodar `/pwf-doc update` (e `/pwf-doc-capture`, quando fizer sentido) se houve mudanca de codigo sem atualizar docs.
- `beforeShellExecution` (matcher: `git commit`) -> lembra convencao de commit (`[TICKET-XXXX] ...`).
- `afterShellExecution` (matcher: `typeorm:generate`) -> lembra cadeia atomica de migrations.

Telemetria opcional (opt-in):

- Defina `PSTERS_WORKFLOW_TELEMETRY_OPT_IN=true` para gravar eventos locais de hooks em `.cursor/hooks/state/psters-ai-workflow-telemetry.jsonl`.
- Padrao: desativada.

### Notas de uso

- Mantenha commits focados e, quando possivel, vinculados a ticket.
- Use `/pwf-plan` para mudancas multi-etapas.
- Use `/pwf-work` para implementacoes diretas.
- Use `/pwf-work-light` para mudancas triviais/locais (<=2 arquivos, sem impacto de contrato/esquema).
- Use `/pwf-work-tdd` apenas quando comportamento tests-first for solicitado explicitamente.
- Use `/pwf-review` antes de abrir PR.
- **Nao pule documentacao** — `/pwf-work` e `/pwf-work-plan` atualizam docs como parte do fluxo.

### Presets e extensoes (status pratico atual)

- **Presets** (`presets/presets.json`): hoje influenciam enfase de planejamento e foco de review quando `/pwf-plan` recebe `preset:<nome>`.
- **Extensoes** (`extensions/extensions.json`): o sistema de hook points existe, mas apenas uma extensao vem ativa por padrao (`after_plan` advisory).
- Isso e intencional: o workflow central fica previsivel, com espaco para customizacao gradual por projeto.

### Context7 MCP

Este plugin inclui `mcp.json` com configuracao do servidor Context7 MCP.

- Chave do servidor: `context7`
- Fluxo obrigatorio: `resolve-library-id` -> `query-docs`
- Regra de referencia: `rules/context7-documentation.mdc`

Use esse fluxo sempre que a implementacao depender de docs de bibliotecas/frameworks externos.
