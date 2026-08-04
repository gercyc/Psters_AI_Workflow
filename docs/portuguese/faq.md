# FAQ

## Eu instalei o plugin e ele nao funciona. O que devo checar primeiro?

Primeiro valide o contexto de execucao.

Se voce instalou via WSL, mas abriu o projeto no Cursor Windows (fora do contexto WSL), o plugin pode nao aparecer ou funcionar errado.

Veja o guia de WSL:

- [Cursor no Windows + WSL](cursor-wsl-windows.md)

Checklist rapido:

- confirme onde voce rodou `./scripts/install-plugin-local.sh`
- confirme onde o workspace foi aberto no Cursor (Windows vs WSL)
- recarregue o Cursor depois da instalacao

## Preciso sempre usar `/pwf-plan`?

Nao. Use `/pwf-plan` para mudancas multi-etapas ou de maior risco.
Para fixes pequenos e ajustes pontuais, use `/pwf-work`.

## Qual a diferenca entre `/pwf-work` e `/pwf-work-plan`?

- `/pwf-work-plan`: executa fases planejadas, uma por vez.
- `/pwf-work`: executa mudancas focadas fora de plano formal.

Ambos leem docs primeiro e atualizam docs no proprio fluxo obrigatorio.

## Qual a diferenca entre os comandos da familia `/pwf-doc`?

- `/pwf-doc`: documentacao tecnica canonica por escopo (modulo, feature, arquitetura, ADR, update).
- `/pwf-doc-foundation`: docs base do projeto (infrastructure, architecture, integrations, environments, glossary).
- `/pwf-doc-runbook`: runbooks operacionais em `docs/runbooks/`.
- `/pwf-doc-capture`: artefatos de aprendizado reutilizavel (problema/solucao e padroes).

## Se `/pwf-work` e `/pwf-work-plan` ja atualizam docs, por que usar a familia `/pwf-doc`?

Use quando quiser forcar explicitamente uma saida de documentacao especifica.

## Quem decide o proximo comando: desenvolvedor ou IA?

O desenvolvedor decide.  
O Psters foi feito para execucao previsivel: controle com o desenvolvedor, execucao com a IA.

## Esse workflow realmente obriga documentacao?

Sim. `/pwf-work` e `/pwf-work-plan` leem docs antes de implementar e atualizam docs antes de concluir.
E assim que os padroes do projeto se mantem ao longo do tempo.

## Hooks sao obrigatorios?

Hooks sao guardrails recomendados. Eles reforcam disciplina e lembretes, mas o fluxo principal continua sendo pelos comandos.

## Esse workflow depende de linguagem/framework especifico?

Nao. O workflow e agnostico de linguagem e framework.

## Posso escolher em qual modelo os agentes do plugin rodam?

Sim, no nivel da sessao. Nenhum agente do plugin (research, review, docs, workflow) fixa um
`model` no frontmatter, entao a variavel de ambiente nativa do Claude Code
`CLAUDE_CODE_SUBAGENT_MODEL` controla todos eles de uma vez:

```bash
export CLAUDE_CODE_SUBAGENT_MODEL="opus"   # ou "sonnet", "haiku", ou um model ID completo
```

Essa e uma troca global — ela muda todos os agentes da sessao, nao so os deste plugin, e o
Claude Code nao tem forma nativa de fixar modelos diferentes por agente ou por categoria (ex:
`review/` em Opus, `research/` em Haiku) sem adicionar manualmente o campo `model:` de volta
nos arquivos de agente especificos. Veja o
[CLAUDE.md do plugin Claude Code](../../plugins/psters-ai-workflow/CLAUDE.md) para detalhes.
