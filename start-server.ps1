# Script para iniciar el servidor
Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "  Iniciando Servidor" -ForegroundColor Cyan
Write-Host "=================================`n" -ForegroundColor Cyan

# Verificar si el puerto está en uso
$portInUse = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
if ($portInUse) {
    Write-Host "⚠️  El puerto 3003 está en uso (PID: $($portInUse.OwningProcess))" -ForegroundColor Yellow
    $response = Read-Host "¿Deseas detener el proceso? (S/N)"
    if ($response -eq 'S' -or $response -eq 's') {
        Stop-Process -Id $portInUse.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✅ Proceso detenido`n" -ForegroundColor Green
    } else {
        Write-Host "❌ No se puede iniciar el servidor con el puerto en uso" -ForegroundColor Red
        exit 1
    }
}

# Cambiar al directorio del proyecto
Set-Location $PSScriptRoot

# Verificar que Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    exit 1
}

# Iniciar el servidor
Write-Host "🚀 Iniciando servidor en puerto 3003...`n" -ForegroundColor Green
node server.js
