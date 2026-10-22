# Copia a equipe de agentes para EroErp2.0\.claude e apaga esta pasta.
# Rode com duplo clique no instalar.cmd (ou: powershell -ExecutionPolicy Bypass -File instalar.ps1).
$ErrorActionPreference = 'Stop'
$origem  = Join-Path $PSScriptRoot 'claude'
$destino = Join-Path (Split-Path $PSScriptRoot -Parent) '.claude'

Write-Host "Instalando a equipe em $destino"
Get-ChildItem $origem -Recurse -File | ForEach-Object {
    $rel  = $_.FullName.Substring($origem.Length).TrimStart('\')
    $alvo = Join-Path $destino $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $alvo) | Out-Null
    Copy-Item $_.FullName $alvo -Force
    Write-Host "  .claude\$rel"
}
Write-Host ""
Write-Host "Pronto. Agora faca o commit de .claude\, docs\ e CLAUDE.md para levar a equipe ao outro computador."

try {
    Set-Location (Split-Path $PSScriptRoot -Parent)
    Remove-Item $PSScriptRoot -Recurse -Force
    Write-Host "Pasta _instalar-equipe removida."
} catch {
    Write-Host "Nao consegui apagar a pasta _instalar-equipe - apague-a a mao."
}
