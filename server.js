const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const QRCode = require('qrcode');

const PORT = 3003;
const HOST = '0.0.0.0';

// URL pública (para ngrok o túnel público)
let PUBLIC_URL = process.env.PUBLIC_URL || null;

// Función para detectar ngrok automáticamente
function detectNgrok() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:4040/api/tunnels', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (jsonData.tunnels && jsonData.tunnels.length > 0) {
            // Buscar túnel HTTPS primero, luego HTTP
            const httpsTunnel = jsonData.tunnels.find(t => t.proto === 'https');
            const httpTunnel = jsonData.tunnels.find(t => t.proto === 'http');
            
            if (httpsTunnel) {
              resolve(httpsTunnel.public_url);
              return;
            } else if (httpTunnel) {
              resolve(httpTunnel.public_url);
              return;
            }
          }
        } catch (error) {
          // Error parseando JSON
        }
        resolve(null);
      });
    });
    
    req.on('error', () => {
      // ngrok no está corriendo o no está disponible
      resolve(null);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

// Obtener IP local para QR (excluyendo interfaces virtuales)
function getLocalIP() {
  const interfaces = require('os').networkInterfaces();
  const excludedPrefixes = ['192.168.56.', '192.168.99.', '10.0.2.', '169.254.'];
  const excludedNames = ['VirtualBox', 'VMware', 'vboxnet', 'vmnet', 'WSL', 'Hyper-V', 'Loopback'];
  
  const candidates = [];
  
  for (const name of Object.keys(interfaces)) {
    // Saltar interfaces virtuales conocidas
    const isExcluded = excludedNames.some(excluded => name.toLowerCase().includes(excluded.toLowerCase()));
    if (isExcluded) continue;
    
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Saltar IPs de rangos virtuales conocidos
        const isExcludedIP = excludedPrefixes.some(prefix => iface.address.startsWith(prefix));
        if (!isExcludedIP) {
          candidates.push({ name, address: iface.address });
        }
      }
    }
  }
  
  // Priorizar interfaces WiFi/Ethernet reales
  const wifiEthernet = candidates.filter(c => {
    const nameLower = c.name.toLowerCase();
    return nameLower.includes('wi-fi') || 
           nameLower.includes('wifi') ||
           nameLower.includes('wireless') ||
           nameLower.includes('ethernet') ||
           nameLower.includes('lan') ||
           nameLower.includes('local area connection');
  });
  
  if (wifiEthernet.length > 0) {
    console.log(`IP detectada (WiFi/Ethernet): ${wifiEthernet[0].address} (${wifiEthernet[0].name})`);
    return wifiEthernet[0].address;
  }
  
  // Si no hay WiFi/Ethernet, usar la primera candidata que no sea 192.168.56.x
  const nonVirtual = candidates.filter(c => !c.address.startsWith('192.168.56.'));
  if (nonVirtual.length > 0) {
    console.log(`IP detectada: ${nonVirtual[0].address} (${nonVirtual[0].name})`);
    return nonVirtual[0].address;
  }
  
  // Último recurso: cualquier IP disponible
  if (candidates.length > 0) {
    console.log(`IP detectada (fallback): ${candidates[0].address} (${candidates[0].name})`);
    return candidates[0].address;
  }
  
  console.log('No se encontró IP válida, usando localhost');
  return 'localhost';
}

const LOCAL_IP = getLocalIP();

// Sesiones activas: { sessionId: { gameClient: ws, controllerClient: ws } }
const sessions = {};

// Detectar ngrok al iniciar (con reintentos)
let ngrokCheckInterval = null;

function checkAndSetNgrok() {
  detectNgrok().then((ngrokUrl) => {
    if (ngrokUrl) {
      // Actualizar PUBLIC_URL si ngrok está disponible
      if (!PUBLIC_URL || PUBLIC_URL !== ngrokUrl) {
        PUBLIC_URL = ngrokUrl;
        console.log(`🌐 Usando URL pública de ngrok: ${PUBLIC_URL}`);
      }
    } else {
      // Si ngrok se desconectó, limpiar PUBLIC_URL (a menos que esté configurada manualmente)
      if (PUBLIC_URL && !process.env.PUBLIC_URL) {
        PUBLIC_URL = null;
      }
    }
  });
}

// Verificar ngrok inmediatamente y luego cada 30 segundos (reducido para menos spam)
checkAndSetNgrok();
ngrokCheckInterval = setInterval(checkAndSetNgrok, 30000);

// Generar sessionId único
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Manejar errores no capturados
  req.on('error', (err) => {
    console.error('Error en request:', err);
  });

  res.on('error', (err) => {
    console.error('Error en response:', err);
  });

  // Endpoint para generar QR
  if (req.url === '/api/qr') {
    const sessionId = generateSessionId();
    
    // Verificar ngrok antes de generar QR (por si acaba de iniciarse)
    checkAndSetNgrok();
    
    // Usar URL pública si está configurada, sino usar IP local
    let baseUrl;
    if (PUBLIC_URL) {
      baseUrl = PUBLIC_URL.replace(/\/$/, ''); // Remover trailing slash
    } else {
      baseUrl = `http://${LOCAL_IP}:${PORT}`;
    }
    
    const controllerUrl = `${baseUrl}/controller.html?session=${sessionId}`;
    
    console.log(`📱 Generando QR para: ${controllerUrl}`);
    if (PUBLIC_URL) {
      console.log(`   (URL pública detectada automáticamente)`);
    } else {
      console.log(`   (Usando IP local - inicia ngrok para acceso público)`);
    }
    
    QRCode.toDataURL(controllerUrl, (err, qrDataUrl) => {
      if (err) {
        console.error('Error generando QR:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Error generando QR' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        sessionId, 
        qrUrl: qrDataUrl, 
        controllerUrl,
        baseUrl
      }));
    });
    return;
  }

  // Determinar ruta del archivo
  let filePath;
  if (req.url === '/') {
    filePath = './dist/lobby.html';
  } else if (req.url.startsWith('/controller.html')) {
    // Asegurar que controller.html se sirva correctamente
    filePath = './dist/controller.html';
  } else if (req.url.startsWith('/index.html')) {
    filePath = './dist/index.html';
  } else {
    filePath = './dist' + req.url;
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log(`Archivo no encontrado: ${filePath}`);
        // Solo servir lobby.html como fallback si no es una solicitud específica
        if (req.url === '/' || req.url.startsWith('/controller.html') || req.url.startsWith('/index.html')) {
          console.error(`Error: No se encontró ${filePath}`);
          res.writeHead(404);
          res.end(`Error 404: Archivo no encontrado - ${req.url}`);
        } else {
          // Para otras rutas, intentar servir lobby.html
          fs.readFile('./dist/lobby.html', (err, content) => {
            if (err) {
              console.error('Error leyendo lobby.html:', err);
              res.writeHead(500);
              res.end(`Error: No se pudo cargar el archivo`);
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content, 'utf-8');
            }
          });
        }
      } else {
        console.error(`Error leyendo archivo ${filePath}:`, error);
        res.writeHead(500);
        res.end(`Error: ${error.code}`);
      }
    } else {
      console.log(`Sirviendo: ${filePath} (${contentType})`);
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
    console.error('   Cierra el proceso que está usando el puerto o cambia el puerto.\n');
  } else {
    console.error('Error del servidor:', err);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('=================================');
  console.log('  Hidden Puzzle Game - Servidor');
  console.log('=================================');
  console.log('');
  console.log('✅ Servidor iniciado correctamente');
  console.log('');
  console.log('URLs disponibles:');
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Red:   http://${LOCAL_IP}:${PORT}`);
  if (PUBLIC_URL) {
    console.log(`  🌐 Pública (ngrok): ${PUBLIC_URL}`);
  } else {
    console.log(`  🌐 Pública: No detectada`);
  }
  console.log('');
  if (!PUBLIC_URL) {
    console.log('💡 Para acceso público automático:');
    console.log('   1. Ejecuta en otra terminal: npx ngrok http 3003');
    console.log('   2. El servidor detectará ngrok automáticamente');
    console.log('   3. Recarga la página del lobby para generar nuevo QR');
    console.log('');
  } else {
    console.log('✅ ngrok detectado - El QR usará la URL pública automáticamente');
    console.log('');
  }
  console.log('Presiona Ctrl+C para detener');
  console.log('');
});

// WebSocket Server
// Configurar para aceptar conexiones a través de proxies (ngrok)
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info) => {
    // Aceptar todas las conexiones (ngrok maneja la autenticación)
    console.log('Verificando cliente WebSocket:', info.origin || 'sin origen');
    return true;
  },
  // Configurar ping/pong para mantener conexiones vivas
  clientTracking: true,
  perMessageDeflate: false
});

// Ping cada 30 segundos para mantener conexiones vivas
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Cerrando conexión inactiva');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('error', (error) => {
  console.error('Error en WebSocket Server:', error);
});

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  // Construir URL correctamente para WebSocket (puede ser ws:// o wss://)
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers.host || req.headers[':authority'] || 'localhost:3003';
  const baseUrl = `${protocol}://${host}`;
  
  console.log(`Intento de conexión WebSocket: ${req.url}`);
  console.log(`  Host: ${host}, Protocol: ${protocol}`);
  
  let url;
  try {
    url = new URL(req.url, baseUrl);
  } catch (error) {
    console.error('Error parseando URL:', error);
    console.error('  req.url:', req.url);
    console.error('  baseUrl:', baseUrl);
    ws.close(1008, 'Invalid URL');
    return;
  }
  
  const type = url.searchParams.get('type'); // 'game' o 'controller'
  const sessionId = url.searchParams.get('session');
  
  console.log(`  Type: ${type}, SessionId: ${sessionId}`);

  if (!type || !sessionId) {
    console.error(`❌ Conexión rechazada: falta type (${type}) o sessionId (${sessionId})`);
    console.error(`  URL completa: ${req.url}`);
    ws.close(1008, `Missing required parameters: type=${type}, sessionId=${sessionId}`);
    return;
  }

  console.log(`Cliente conectado: ${type} - sesión: ${sessionId}`);

  if (!sessions[sessionId]) {
    sessions[sessionId] = {};
  }

  if (type === 'game') {
    // Cliente del juego (monolito)
    // Si ya había un cliente del juego conectado, cerrarlo primero (reconexión)
    if (sessions[sessionId] && sessions[sessionId].gameClient) {
      console.log(`Cerrando conexión anterior del juego - sesión: ${sessionId}`);
      sessions[sessionId].gameClient.close();
    }
    
    sessions[sessionId].gameClient = ws;
    
    // Si el controlador ya estaba conectado, notificarlo inmediatamente
    // Usar múltiples intentos para asegurar que el mensaje se envíe
    const sendConnectedMessage = () => {
      if (ws.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({ type: 'connected' });
        ws.send(message);
        console.log(`📤 Enviando mensaje 'connected' al juego - sesión: ${sessionId}`);
        return true;
      }
      return false;
    };
    
    if (sessions[sessionId].controllerClient && sessions[sessionId].controllerClient.readyState === WebSocket.OPEN) {
      console.log(`✅ Juego conectado, controlador ya estaba listo - sesión: ${sessionId}`);
      // Intentar enviar inmediatamente y luego con delays
      sendConnectedMessage();
      setTimeout(() => sendConnectedMessage(), 100);
      setTimeout(() => sendConnectedMessage(), 500);
      setTimeout(() => sendConnectedMessage(), 1000);
    } else if (sessions[sessionId].controllerReady) {
      // Si el controlador se conectó antes pero el juego no estaba listo
      console.log(`✅ Juego conectado, controlador estaba esperando - sesión: ${sessionId}`);
      sendConnectedMessage();
      setTimeout(() => sendConnectedMessage(), 100);
      setTimeout(() => sendConnectedMessage(), 500);
      setTimeout(() => sendConnectedMessage(), 1000);
    } else {
      console.log(`⏳ Juego conectado, esperando controlador - sesión: ${sessionId}`);
    }
    
    // Manejar mensajes del juego (ping/pong para mantener conexión)
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`📥 Mensaje del juego - sesión: ${sessionId}`, data);
        
        if (data.type === 'ping') {
          // Responder con pong y estado del controlador
          const hasController = sessions[sessionId]?.controllerClient?.readyState === WebSocket.OPEN;
          const response = { type: hasController ? 'connected' : 'pong', controllerConnected: hasController };
          ws.send(JSON.stringify(response));
          console.log(`📤 Respondiendo al juego - sesión: ${sessionId}`, response);
        }
      } catch (e) {
        console.error('Error procesando mensaje del juego:', e);
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`Juego desconectado - sesión: ${sessionId} (código: ${code})`);
      // Solo eliminar la sesión si el controlador también se desconectó
      // Esto permite reconexión del juego sin perder el controlador
      if (sessions[sessionId]) {
        // Si el controlador sigue conectado, mantener la sesión
        if (sessions[sessionId].controllerClient && sessions[sessionId].controllerClient.readyState === WebSocket.OPEN) {
          console.log(`Manteniendo sesión activa (controlador aún conectado) - sesión: ${sessionId}`);
          sessions[sessionId].gameClient = null;
        } else {
          // Si ambos están desconectados, eliminar la sesión
          delete sessions[sessionId];
        }
      }
    });

    ws.on('error', (error) => {
      console.error('Error en cliente juego:', error);
      // Limpiar sesión en caso de error
      if (sessions[sessionId]) {
        if (sessions[sessionId].controllerClient) {
          sessions[sessionId].controllerClient.close();
        }
        delete sessions[sessionId];
      }
    });

  } else if (type === 'controller') {
    // Cliente del controlador (celular)
    // Si ya había un controlador conectado, cerrarlo primero (reconexión)
    if (sessions[sessionId] && sessions[sessionId].controllerClient) {
      console.log(`Cerrando conexión anterior del controlador - sesión: ${sessionId}`);
      sessions[sessionId].controllerClient.close();
    }
    
    sessions[sessionId].controllerClient = ws;
    sessions[sessionId].controllerReady = true;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        // Verificar que la sesión y el cliente del juego existan
        if (sessions[sessionId] && sessions[sessionId].gameClient && sessions[sessionId].gameClient.readyState === WebSocket.OPEN) {
          sessions[sessionId].gameClient.send(JSON.stringify(data));
        } else {
          // Solo mostrar warning cada 5 segundos para no saturar
          if (!sessions[sessionId]._lastWarning || Date.now() - sessions[sessionId]._lastWarning > 5000) {
            console.log(`⚠️ Juego no disponible para reenviar mensaje - sesión: ${sessionId}`);
            sessions[sessionId]._lastWarning = Date.now();
          }
        }
      } catch (e) {
        console.error('Error procesando mensaje del controlador:', e);
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`Controlador desconectado - sesión: ${sessionId} (código: ${code}, razón: ${reason || 'sin razón'})`);
      // Verificar que la sesión aún existe antes de acceder
      if (sessions[sessionId]) {
        // Notificar al juego que el controlador se desconectó
        if (sessions[sessionId].gameClient && sessions[sessionId].gameClient.readyState === WebSocket.OPEN) {
          sessions[sessionId].gameClient.send(JSON.stringify({ type: 'disconnect' }));
        }
        // No eliminar la sesión aquí, solo limpiar el controlador
        // Esto permite reconexión del controlador sin perder el juego
        sessions[sessionId].controllerClient = null;
        sessions[sessionId].controllerReady = false;
      }
    });

    ws.on('error', (error) => {
      console.error('Error en cliente controlador:', error);
      // Limpiar solo el controlador, no toda la sesión
      if (sessions[sessionId]) {
        sessions[sessionId].controllerClient = null;
      }
    });

    // Notificar al juego que el controlador se conectó
    // Esperar un momento para asegurar que el juego esté listo
    setTimeout(() => {
      if (sessions[sessionId] && sessions[sessionId].gameClient && sessions[sessionId].gameClient.readyState === WebSocket.OPEN) {
        console.log(`Enviando mensaje 'connected' al juego - sesión: ${sessionId}`);
        sessions[sessionId].gameClient.send(JSON.stringify({ type: 'connected' }));
      } else {
        console.log(`Juego no está conectado aún - sesión: ${sessionId}`);
        // Guardar que el controlador está listo para cuando el juego se conecte
        if (sessions[sessionId]) {
          sessions[sessionId].controllerReady = true;
        }
      }
    }, 100);
  }
});
