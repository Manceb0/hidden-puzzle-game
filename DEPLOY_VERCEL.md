# 🚀 Desplegar Hidden Puzzle Game en Vercel

Este documento explica cómo desplegar el juego en Vercel usando Pusher para la comunicación en tiempo real.

## 📋 Requisitos Previos

1. **Cuenta de GitHub** - Para subir el código
2. **Cuenta de Vercel** - Gratis en [vercel.com](https://vercel.com)
3. **Cuenta de Pusher** - Gratis en [pusher.com](https://pusher.com)

## 🔧 Paso 1: Configurar Pusher

1. Ve a [https://dashboard.pusher.com](https://dashboard.pusher.com)
2. Crea una cuenta gratuita (o inicia sesión)
3. Crea una nueva app:
   - Click en "Create app"
   - Nombre: `hidden-puzzle-game`
   - Cluster: Selecciona el más cercano (ej: `us2`, `eu`, `ap1`)
   - Frontend: `Vanilla JavaScript`
   - Backend: `Node.js`
4. Ve a "App Keys" y copia:
   - `app_id`
   - `key`
   - `secret`
   - `cluster`

## 🔧 Paso 2: Configurar el Proyecto

### Actualiza `public/config.js`:

```javascript
window.PUSHER_KEY = 'TU_KEY_DE_PUSHER';  // La "key" de App Keys
window.PUSHER_CLUSTER = 'us2';            // Tu cluster
```

## 🔧 Paso 3: Subir a GitHub

```bash
# Inicializar git si no está inicializado
git init

# Agregar todos los archivos
git add .

# Commit
git commit -m "Preparado para Vercel"

# Crear repo en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/hidden-puzzle-game.git
git push -u origin main
```

## 🔧 Paso 4: Desplegar en Vercel

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio de GitHub
3. Configura las **Variables de Entorno**:

   | Variable | Valor |
   |----------|-------|
   | `PUSHER_APP_ID` | Tu app_id de Pusher |
   | `PUSHER_KEY` | Tu key de Pusher |
   | `PUSHER_SECRET` | Tu secret de Pusher |
   | `PUSHER_CLUSTER` | Tu cluster (ej: `us2`) |

4. Click en "Deploy"

## ✅ Verificar Despliegue

Una vez desplegado:

1. Abre `https://tu-proyecto.vercel.app/lobby.html`
2. Escanea el código QR con tu celular
3. ¡Juega!

## 📁 Estructura del Proyecto para Vercel

```
hidden-puzzle-game/
├── api/                    # Funciones serverless
│   ├── qr.js              # Genera códigos QR
│   ├── pusher-auth.js     # Autenticación Pusher
│   └── trigger.js         # Envía eventos Pusher
├── public/                 # Archivos estáticos
│   ├── lobby.html         # Página principal (QR)
│   ├── controller.html    # Control remoto (móvil)
│   ├── index.html         # El juego
│   ├── script.js          # Lógica del juego
│   ├── style.css          # Estilos
│   ├── config.js          # Config de Pusher
│   └── *.png              # Imágenes
├── vercel.json            # Configuración de Vercel
└── package.json           # Dependencias
```

## 🆓 Límites del Plan Gratuito

### Vercel (Hobby Plan)
- ✅ Despliegues ilimitados
- ✅ 100GB bandwidth/mes
- ✅ Funciones serverless incluidas

### Pusher (Sandbox Plan)
- ✅ 200,000 mensajes/día
- ✅ 100 conexiones simultáneas
- ✅ Perfecto para demos y proyectos pequeños

## 🔄 Alternativa: Mantener Servidor Local

Si prefieres usar el servidor local con ngrok (sin Pusher):

```bash
# Usar la versión original
npm start

# En otra terminal
npx ngrok http 3003
```

## ❓ Solución de Problemas

### Error "Missing Pusher credentials"
- Verifica que las variables de entorno estén configuradas en Vercel

### El QR no funciona
- Asegúrate de que `PUSHER_KEY` en `config.js` coincida con Vercel

### El controlador no se conecta
- Verifica que el `PUSHER_CLUSTER` sea correcto
- Revisa la consola del navegador para errores

## 📞 Soporte

Si tienes problemas, revisa:
1. Logs en Vercel Dashboard → Functions
2. Consola del navegador (F12)
3. Dashboard de Pusher → Debug Console
