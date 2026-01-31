import Pusher from 'pusher';

// Configuración de Pusher
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
    const { channel, event, data } = req.body;
    
    if (!channel || !event) {
      return res.status(400).json({ error: 'Missing channel or event' });
    }
    
    await pusher.trigger(channel, event, data || {});
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error enviando evento Pusher:', error);
    res.status(500).json({ error: 'Error enviando evento' });
  }
}
