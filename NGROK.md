# Usar ngrok para Acceso Público

## Opción 1: Script Automático (Recomendado)

```powershell
.\start-with-ngrok.ps1
```

Este script:
1. Inicia el servidor Node.js
2. Inicia ngrok automáticamente
3. Te muestra la URL pública
4. Te indica cómo reiniciar el servidor con la URL pública

## Opción 2: Manual

### Paso 1: Iniciar ngrok

En una terminal:
```powershell
npx ngrok http 3003
```

O si tienes ngrok instalado globalmente:
```powershell
ngrok http 3003
```

### Paso 2: Obtener la URL pública

Abre http://localhost:4040 en tu navegador o revisa la terminal de ngrok.

Verás algo como:
```
Forwarding  https://abc123-def456.ngrok.io -> http://localhost:3003
```

Copia la URL HTTPS (la que empieza con `https://`)

### Paso 3: Reiniciar el servidor con la URL pública

Detén el servidor actual (Ctrl+C) y reinícialo con:

```powershell
$env:PUBLIC_URL="https://abc123-def456.ngrok.io"; node server.js
```

**Windows PowerShell:**
```powershell
$env:PUBLIC_URL="https://abc123-def456.ngrok.io"
node server.js
```

**Windows CMD:**
```cmd
set PUBLIC_URL=https://abc123-def456.ngrok.io
node server.js
```

### Paso 4: Probar

1. Abre `http://localhost:3003` en el monolito
2. Escanea el QR con tu celular (desde cualquier red)
3. El controlador debería conectarse correctamente

## Notas Importantes

- **HTTPS requerido**: ngrok usa HTTPS, por lo que el WebSocket automáticamente usa WSS (WebSocket Secure)
- **URL temporal**: La URL de ngrok cambia cada vez que reinicias (a menos que uses cuenta de pago)
- **Mismo QR**: Una vez configurada la URL pública, el QR funcionará desde cualquier lugar del mundo
- **Seguridad**: ngrok es público, cualquiera con la URL puede acceder

## Solución de Problemas

### El QR no funciona desde fuera de la red
- Verifica que hayas configurado `PUBLIC_URL` correctamente
- Asegúrate de usar la URL HTTPS (no HTTP) de ngrok
- Reinicia el servidor después de configurar `PUBLIC_URL`

### WebSocket no se conecta
- Verifica que ngrok esté corriendo
- Asegúrate de usar `wss://` (no `ws://`) cuando uses HTTPS
- Revisa la consola del navegador para ver errores

### El controlador abre el lobby en lugar del joystick
- Verifica que la URL del QR apunte a `/controller.html?session=...`
- Asegúrate de que el servidor esté sirviendo correctamente `controller.html`
