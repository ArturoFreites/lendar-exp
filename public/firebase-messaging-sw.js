// Importar los scripts de Firebase (versión compat para service workers)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase
// IMPORTANTE: Este archivo se actualiza automáticamente durante el build con las variables de entorno
// Los service workers NO pueden usar variables de entorno (import.meta.env)
// El script scripts/inject-sw-env.js inyecta los valores de VITE_FIREBASE_* durante el build
// Asegúrate de configurar estas variables en Vercel Dashboard > Settings > Environment Variables
const firebaseConfig = {
  "apiKey": "",
  "authDomain": "",
  "projectId": "lendar-app",
  "storageBucket": "",
  "messagingSenderId": "",
  "appId": ""
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener instancia de messaging
const messaging = firebase.messaging();

// Manejar mensajes en background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon.png', // Asegúrate de tener un icono en public/
    badge: '/badge.png',
    tag: payload.data?.notificationId || 'default',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
  };

  // Notificar a todos los clientes activos (ventanas abiertas de la app) primero
  self.clients.matchAll({ 
    type: 'window', 
    includeUncontrolled: true 
  }).then((clientList) => {
    // Enviar mensaje a todos los clientes activos
    clientList.forEach((client) => {
      client.postMessage({
        type: 'NOTIFICATION_RECEIVED',
        payload: payload
      });
    });
  }).catch((error) => {
    console.error('[firebase-messaging-sw.js] Error notificando clientes:', error);
  });

  // Mostrar la notificación del sistema
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificación clickeada:', event);
  
  event.notification.close();
  
  // Abrir o enfocar la ventana de la app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.deepLink || '/';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
