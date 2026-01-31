// ============================================
// CONFIGURACIÓN DE PUSHER PARA VERCEL
// ============================================
// 
// INSTRUCCIONES:
// 1. Crea una cuenta gratuita en https://pusher.com
// 2. Crea una nueva app en Pusher Channels
// 3. Copia las credenciales aquí
// 4. En Vercel, configura las variables de entorno:
//    - PUSHER_APP_ID
//    - PUSHER_KEY
//    - PUSHER_SECRET
//    - PUSHER_CLUSTER
//
// Este archivo es para desarrollo local.
// En producción, las variables se leen de Vercel.
// ============================================

window.PUSHER_KEY = 'TU_PUSHER_KEY_AQUI';
window.PUSHER_CLUSTER = 'us2';

// NOTA: Nunca expongas PUSHER_SECRET en el frontend
// Solo se usa en las API routes del servidor
