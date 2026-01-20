// Importar los scripts de Firebase (versión compat para service workers)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase
// IMPORTANTE: Este archivo debe tener los valores reales de Firebase
// Los service workers NO pueden usar variables de entorno (import.meta.env)
// Obtén estos valores de Firebase Console > Configuración del proyecto > Configuración general
// O usa el mismo firebaseConfig que está en src/app/services/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBtAL6MeLPfljeXGeOM_wGz3O", // Reemplaza con VITE_FIREBASE_API_KEY de tu .env
  authDomain: "lendar-app.firebaseapp.com", // Reemplaza con VITE_FIREBASE_AUTH_DOMAIN
  projectId: "lendar-app", // Reemplaza con VITE_FIREBASE_PROJECT_ID
  storageBucket: "lendar-app.appspot.com", // Reemplaza con VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "744581318647", // Reemplaza con VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:744581318647:web:c96c6b4d5f1d4c707c10f" // Reemplaza con VITE_FIREBASE_APP_ID
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
