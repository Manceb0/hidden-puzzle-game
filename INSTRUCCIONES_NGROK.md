# 🚀 Instrucciones para usar con ngrok (Acceso Público)

## Problema que resuelve
Cuando escaneas el QR desde fuera de tu red WiFi, el celular no puede conectarse porque usa una IP local (`192.168.x.x`). Con ngrok puedes crear un túnel público que funciona desde cualquier lugar.

## Pasos Rápidos

### 1. Iniciar ngrok
Abre una terminal y ejecuta:
```powershell
npx ngrok http 3003
```

### 2. Copiar la URL HTTPS
En la terminal de ngrok verás algo como:
```
Forwarding  https://abc123-def456.ngrok.io -> http://localhost:3003
```
**Copia la URL HTTPS completa** (la que empieza con `https://`)

### 3. Reiniciar el servidor con la URL pública
En otra terminal, detén el servidor actual (Ctrl+C) y ejecuta:

**PowerShell:**
```powershell
$env:PUBLIC_URL="https://abc123-def456.ngrok.io"
node server.js
```

**CMD:**
```cmd
set PUBLIC_URL=https://abc123-def456.ngrok.io
node server.js
```

### 4. Probar
1. Abre `http://localhost:3003` en el monolito
2. Verás un QR con la URL pública de ngrok
3. Escanea el QR desde tu celular (desde cualquier red)
4. Se abrirá el controlador del juego en tu celular

## ⚠️ Solución al problema: "Abre la misma pantalla"

Si cuando escaneas el QR se abre el lobby en lugar del controlador:

1. **Verifica la URL del QR**: Debe ser algo como:
   ```
   https://abc123.ngrok.io/controller.html?session=xxxxx
   ```
   NO debe ser solo `https://abc123.ngrok.io/`

2. **Recarga la página del lobby**: Presiona F5 en `http://localhost:3003` para generar un nuevo QR

3. **Verifica que ngrok esté corriendo**: El túnel debe estar activo mientras uses el juego

4. **Revisa la consola del navegador**: Abre las herramientas de desarrollador (F12) y revisa si hay errores

## 🔧 Script Automático

También puedes usar el script incluido:
```powershell
.\start-with-ngrok.ps1
```

Este script te guiará paso a paso.

## 📝 Notas Importantes

- **ngrok debe estar corriendo** mientras uses el juego
- La URL de ngrok **cambia cada vez** que lo reinicias (a menos que tengas cuenta de pago)
- Si reinicias ngrok, **debes reiniciar el servidor** con la nueva URL
- El WebSocket automáticamente usa WSS (seguro) cuando usas HTTPS

## 🐛 Troubleshooting

### El QR no funciona
- Verifica que `PUBLIC_URL` esté configurado correctamente
- Asegúrate de usar la URL HTTPS (no HTTP)
- Reinicia el servidor después de configurar `PUBLIC_URL`

### Se abre el lobby en lugar del controlador
- Verifica que la URL del QR termine en `/controller.html?session=...`
- Recarga la página del lobby para generar un nuevo QR
- Verifica que `dist/controller.html` exista

### WebSocket no se conecta
- Verifica que ngrok esté corriendo
- Asegúrate de usar `wss://` (automático con HTTPS)
- Revisa la consola del navegador (F12) para ver errores
