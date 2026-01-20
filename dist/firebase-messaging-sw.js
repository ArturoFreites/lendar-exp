// Importar los scripts de Firebase (versión compat para service workers)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase
// NOTA: En producción, deberías generar este archivo dinámicamente con las variables de entorno
// Por ahora, usa los valores de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "lendar-app.firebaseapp.com",
  projectId: "lendar-app",
  storageBucket: "lendar-app.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
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
