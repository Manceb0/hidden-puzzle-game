# Script para iniciar servidor con ngrok
Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "  Iniciando con ngrok" -ForegroundColor Cyan
Write-Host "=================================`n" -ForegroundColor Cyan

# Verificar que ngrok está instalado
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  ngrok no está instalado" -ForegroundColor Yellow
    Write-Host "   Instalando ngrok..." -ForegroundColor Yellow
    Write-Host "   Ejecuta: npm install -g ngrok" -ForegroundColor Yellow
    Write-Host "   O descarga desde: https://ngrok.com/download`n" -ForegroundColor Yellow
    
    $useNpx = Read-Host "¿Usar npx ngrok? (S/N)"
    if ($useNpx -ne 'S' -and $useNpx -ne 's') {
        Write-Host "❌ No se puede continuar sin ngrok" -ForegroundColor Red
        exit 1
    }
    $ngrokCmd = "npx ngrok"
} else {
    $ngrokCmd = "ngrok"
}

# Verificar si el puerto está en uso
$portInUse = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
if ($portInUse) {
    Write-Host "⚠️  El puerto 3003 está en uso (PID: $($portInUse.OwningProcess))" -ForegroundColor Yellow
    $response = Read-Host "¿Deseas detener el proceso? (S/N)"
    if ($response -eq 'S' -or $response -eq 's') {
        Stop-Process -Id $portInUse.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✅ Proceso detenido`n" -ForegroundColor Green
    }
}

# Cambiar al directorio del proyecto
Set-Location $PSScriptRoot

# Iniciar servidor en segundo plano
Write-Host "🚀 Iniciando servidor Node.js..." -ForegroundColor Green
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot
    node server.js
}

Start-Sleep -Seconds 3

# Iniciar ngrok
Write-Host "🌐 Iniciando túnel ngrok...`n" -ForegroundColor Green
$ngrokProcess = Start-Process -FilePath $ngrokCmd -ArgumentList "http", "3003" -PassThru -NoNewWindow

Write-Host "Esperando 5 segundos para que ngrok se inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Intentar obtener la URL de ngrok
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
    if ($ngrokApi.tunnels) {
        $httpsUrl = ($ngrokApi.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1).public_url
        if ($httpsUrl) {
            Write-Host "`n✅ ngrok iniciado correctamente" -ForegroundColor Green
            Write-Host "`n📋 URL pública: $httpsUrl" -ForegroundColor Cyan
            Write-Host "`n⚠️  IMPORTANTE: Reinicia el servidor con esta URL:" -ForegroundColor Yellow
            Write-Host "   Stop-Job -Id $($serverJob.Id); Remove-Job -Id $($serverJob.Id)" -ForegroundColor White
            Write-Host "   `$env:PUBLIC_URL=`"$httpsUrl`"; node server.js`n" -ForegroundColor White
        }
    }
} catch {
    Write-Host "`n⚠️  No se pudo obtener la URL de ngrok automáticamente" -ForegroundColor Yellow
    Write-Host "   Abre http://localhost:4040 en tu navegador para ver la URL" -ForegroundColor Yellow
    Write-Host "   Luego reinicia el servidor con:" -ForegroundColor Yellow
    Write-Host "   `$env:PUBLIC_URL=`"<URL_DE_NGROK>`"; node server.js`n" -ForegroundColor White
}

Write-Host "Presiona Ctrl+C para detener ngrok y el servidor" -ForegroundColor Cyan
Write-Host ""

# Esperar hasta que el usuario presione Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nDeteniendo procesos..." -ForegroundColor Yellow
    Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Job -Id $serverJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $serverJob.Id -ErrorAction SilentlyContinue
    Write-Host "✅ Procesos detenidos" -ForegroundColor Green
}
