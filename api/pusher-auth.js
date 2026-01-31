import Pusher from 'pusher';

// Configuración de Pusher (usar variables de entorno en producción)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { socket_id, channel_name } = req.body;
    
    // Autenticar el canal privado
    const authResponse = pusher.authorizeChannel(socket_id, channel_name);
    
    res.status(200).json(authResponse);
  } catch (error) {
    console.error('Error en autenticación Pusher:', error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
}
