# Solución de Problemas - Control Remoto

## Error: Código 1005 (Desconectado)

### ¿Qué significa?
El código 1005 significa "No Status Received" - la conexión se cerró sin un código de cierre apropiado.

### Posibles causas:

1. **ngrok no está configurado para WebSockets**
   - ngrok Free puede tener limitaciones con WebSockets
   - Solución: Verifica que ngrok esté corriendo y que la URL sea HTTPS

2. **La URL del WebSocket está mal formada**
   - Verifica en la consola del navegador qué URL se está intentando conectar
   - Debe ser: `wss://undeduced-katrina-uninvitingly.ngrok-free.dev?type=controller&session=xxxxx`

3. **El sessionId no se está pasando correctamente**
   - Verifica que la URL del QR incluya el parámetro `session`
   - Debe ser: `https://xxx.ngrok.io/controller.html?session=xxxxx`

4. **El servidor está rechazando la conexión**
   - Revisa los logs del servidor para ver si hay errores
   - Verifica que el servidor esté corriendo y escuchando en el puerto 3003

### Pasos para diagnosticar:

1. **Abre la consola del navegador en el celular:**
   - En Chrome/Edge móvil: Menú → Más herramientas → Herramientas para desarrolladores
   - O conecta el celular a tu PC y usa Chrome DevTools remoto

2. **Revisa los logs del servidor:**
   ```powershell
   # Deberías ver algo como:
   Intento de conexión WebSocket: /?type=controller&session=xxxxx
   Cliente conectado: controller - sesión: xxxxx
   ```

3. **Verifica la URL del QR:**
   - Escanea el QR y verifica que la URL sea correcta
   - Debe incluir `/controller.html?session=xxxxx`

4. **Prueba sin ngrok primero:**
   - Conecta el celular a la misma red WiFi
   - Usa la IP local: `http://192.168.86.44:3003`
   - Si funciona localmente, el problema es con ngrok

### Soluciones:

#### Si el problema es con ngrok:

1. **Verifica que ngrok esté corriendo:**
   ```powershell
   npx ngrok http 3003
   ```

2. **Usa ngrok con cuenta (más estable):**
   - Las cuentas gratuitas de ngrok tienen mejor soporte para WebSockets
   - Regístrate en: https://dashboard.ngrok.com/

3. **Alternativa: Usa otra herramienta de túnel:**
   - Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:3003`
   - LocalTunnel: `npx localtunnel --port 3003`

#### Si el problema persiste:

1. **Reinicia el servidor:**
   ```powershell
   # Detén el servidor (Ctrl+C)
   node server.js
   ```

2. **Limpia la caché del navegador:**
   - En el celular, limpia la caché del navegador
   - O usa modo incógnito

3. **Verifica el firewall:**
   - Asegúrate de que el puerto 3003 esté abierto
   - Windows Firewall puede estar bloqueando conexiones

### Logs útiles para debugging:

**En el servidor deberías ver:**
```
Intento de conexión WebSocket: /?type=controller&session=xxxxx
  Host: undeduced-katrina-uninvitingly.ngrok-free.dev, Protocol: https
  Type: controller, SessionId: xxxxx
Cliente conectado: controller - sesión: xxxxx
```

**En el navegador del celular deberías ver:**
```
Conectando controlador WebSocket a: wss://undeduced-katrina-uninvitingly.ngrok-free.dev?type=controller&session=xxxxx
✅ Controlador WebSocket conectado exitosamente
```

Si ves errores diferentes, compártelos para ayudar a diagnosticar el problema.
