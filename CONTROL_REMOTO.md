# Control Remoto por QR - Hidden Puzzle Game

## Descripción

Sistema de control remoto que permite a los usuarios escanear un código QR con su celular y controlar el juego desde su dispositivo móvil usando un joystick virtual.

## Cómo funciona

1. **Pantalla de Lobby**: Al iniciar el servidor, la pantalla del monolito muestra un código QR
2. **Escaneo**: El usuario escanea el QR con su celular
3. **Controlador**: Se abre una página con joystick virtual en el celular
4. **Conexión**: Cuando el celular se conecta, el juego inicia automáticamente
5. **Control**: El usuario controla el personaje desde su celular

## Uso

### Iniciar el servidor

```powershell
cd "C:\Users\USUARIO\Downloads\Keramsibrazo\jengacompleto\STEM\hidden-puzzle-game"
node server.js
```

### Acceder al juego

- **Monolito**: Abre `http://localhost:3003` o `http://[IP_LOCAL]:3003`
- **Celular**: Escanea el QR que aparece en la pantalla del monolito

## Arquitectura

- **WebSocket Server**: Maneja la comunicación en tiempo real entre el monolito y el celular
- **Sesiones**: Cada sesión tiene un ID único que vincula el juego con su controlador
- **Protocolo**: Los comandos del joystick se envían como JSON con `{type: 'joystick', ang: angle, dist: distance}`

## Archivos principales

- `server.js`: Servidor HTTP + WebSocket
- `dist/lobby.html`: Pantalla de espera con QR
- `dist/controller.html`: Controlador móvil con joystick
- `dist/script.js`: Lógica del juego con soporte para control remoto
- `dist/index.html`: Juego principal

## Notas técnicas

- El control remoto se activa automáticamente cuando hay un `sessionId` en la URL
- Los eventos táctiles locales se deshabilitan cuando hay control remoto activo
- El joystick remoto envía datos normalizados (0-1) que se convierten a píxeles en el juego
- La conexión WebSocket se mantiene activa durante toda la sesión de juego
