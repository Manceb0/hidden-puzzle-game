import QRCode from 'qrcode';

// Generar sessionId único
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sessionId = generateSessionId();
    
    // Obtener la URL base desde el host del request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    
    const controllerUrl = `${baseUrl}/controller.html?session=${sessionId}`;
    
    // Generar QR como Data URL
    const qrDataUrl = await QRCode.toDataURL(controllerUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.status(200).json({
      sessionId,
      qrUrl: qrDataUrl,
      controllerUrl,
      baseUrl
    });
  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).json({ error: 'Error generando QR' });
  }
}
