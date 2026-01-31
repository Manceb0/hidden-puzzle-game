# Script de prueba del servidor
Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "  Test del Servidor" -ForegroundColor Cyan
Write-Host "=================================`n" -ForegroundColor Cyan

# Verificar que Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js encontrado: $(node --version)" -ForegroundColor Green

# Verificar que las dependencias están instaladas
if (-not (Test-Path "node_modules\ws")) {
    Write-Host "⚠️  Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ Dependencias verificadas`n" -ForegroundColor Green

# Verificar que los archivos necesarios existen
$files = @("server.js", "dist\lobby.html", "dist\controller.html", "dist\index.html", "dist\script.js")
$allExist = $true

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file NO existe" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host "`n❌ Faltan archivos necesarios" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Todos los archivos están presentes`n" -ForegroundColor Green

# Verificar si el puerto está en uso
$portInUse = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  El puerto 3003 está en uso" -ForegroundColor Yellow
    Write-Host "   PID: $($portInUse.OwningProcess)" -ForegroundColor Yellow
    Write-Host "   Puedes detenerlo con: Stop-Process -Id $($portInUse.OwningProcess) -Force`n" -ForegroundColor Yellow
} else {
    Write-Host "✅ El puerto 3003 está disponible`n" -ForegroundColor Green
}

Write-Host "Para iniciar el servidor, ejecuta:" -ForegroundColor Cyan
Write-Host "  node server.js`n" -ForegroundColor White
