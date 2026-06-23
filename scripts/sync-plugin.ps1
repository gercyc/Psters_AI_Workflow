#Requires -Version 5.1
<#
.SYNOPSIS
    Sincroniza o plugin psters-ai-workflow do diretório de desenvolvimento
    para o diretório onde está instalado.

.DESCRIPTION
    Copia skills, commands, agents, hooks e o manifesto do plugin a partir
    do diretório-fonte (este repositório) para o diretório de instalação.
    Suporta atualização total ou apenas de itens novos/alterados.

.PARAMETER Source
    Caminho do diretório-fonte do plugin (padrão: ./plugins/psters-ai-workflow).

.PARAMETER Target
    Caminho onde o plugin está instalado. Padrão: ~/.claude/plugins/psters-ai-workflow.

.PARAMETER WhatIf
    Mostra o que seria copiado, sem copiar de fato.

.EXAMPLE
    .\sync-plugin.ps1
    # Atualiza o plugin usando os caminhos padrão

.EXAMPLE
    .\sync-plugin.ps1 -Target "C:\projetos\meu-app\.claude\plugins\psters-ai-workflow"
    # Atualiza o plugin instalado em outro projeto

.EXAMPLE
    .\sync-plugin.ps1 -WhatIf
    # Mostra o que seria copiado, sem alterar nada
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$Source = (Join-Path $PSScriptRoot "plugins\psters-ai-workflow"),
    [string]$Target = (Join-Path $env:USERPROFILE ".claude\plugins\psters-ai-workflow")
)

# Pastas que precisam ser sincronizadas
$folders = @('.claude-plugin', 'skills', 'commands', 'agents', 'hooks', 'rules', 'assets')

# Arquivos de manifesto que ficam na raiz do plugin
$rootFiles = @('CLAUDE.md', 'README.md', 'LICENSE')

function Write-Header($text) {
    Write-Host ""
    Write-Host "== $text ==" -ForegroundColor Cyan
}

function Test-Exists($path) {
    if (-not (Test-Path $path)) {
        Write-Error "Caminho não encontrado: $path"
        exit 1
    }
}

# ---------------------------------------------------------------------------
Write-Header "Verificando caminhos"
Write-Host "Origem : $Source"
Write-Host "Destino: $Target"

Test-Exists $Source
Test-Exists (Join-Path $Source '.claude-plugin\plugin.json')

# Garante que o diretório de destino existe
if (-not (Test-Path $Target)) {
    if ($PSCmdlet.ShouldProcess($Target, "Criar diretório de destino")) {
        New-Item -ItemType Directory -Path $Target -Force | Out-Null
    }
}

# ---------------------------------------------------------------------------
Write-Header "Sincronizando pastas"

foreach ($folder in $folders) {
    $src = Join-Path $Source $folder
    $dst = Join-Path $Target $folder

    if (-not (Test-Path $src)) {
        Write-Warning "Pasta não encontrada na origem (ignorada): $src"
        continue
    }

    if ($PSCmdlet.ShouldProcess($dst, "Sincronizar pasta '$folder'")) {
        if (-not (Test-Path $dst)) {
            New-Item -ItemType Directory -Path $dst -Force | Out-Null
        }
        # Mirror copia e remove arquivos que não existem mais na origem
        robocopy $src $dst /MIR /NFL /NDL /NJH /NJS /NC /NS | Out-Null
        $code = $LASTEXITCODE
        # Robocopy exit codes: 0=nada, 1=copiou, 2=extras removidos, 3=ambos
        if ($code -le 7) {
            Write-Host "  OK  $folder" -ForegroundColor Green
        } else {
            Write-Warning "  Falha ao sincronizar $folder (robocopy exit $code)"
        }
    }
}

# ---------------------------------------------------------------------------
Write-Header "Sincronizando arquivos da raiz"

foreach ($file in $rootFiles) {
    $src = Join-Path $Source $file
    $dst = Join-Path $Target $file

    if (-not (Test-Path $src)) {
        continue
    }

    if ($PSCmdlet.ShouldProcess($dst, "Copiar $file")) {
        Copy-Item -Path $src -Destination $dst -Force
        Write-Host "  OK  $file" -ForegroundColor Green
    }
}

# ---------------------------------------------------------------------------
Write-Header "Concluído"
Write-Host "Plugin sincronizado em: $Target" -ForegroundColor Green
Write-Host "Reinicie o Claude Code para que as mudanças sejam carregadas." -ForegroundColor Yellow
