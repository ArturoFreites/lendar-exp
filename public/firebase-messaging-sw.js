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

// Manejar eventos push genéricos (desde DevTools o otros servicios)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Evento push recibido:', event);
  
  let notificationTitle = 'Nueva notificación';
  let notificationOptions = {
    body: 'Has recibido una notificación push',
    icon: '/icon.png',
    badge: '/badge.png',
    tag: 'push-notification',
    data: {},
    requireInteraction: false,
    silent: false,
  };

  // Si el evento tiene datos, intentar parsearlos
  if (event.data) {
    try {
      const data = event.data.json();
      notificationTitle = data.title || data.notification?.title || notificationTitle;
      notificationOptions = {
        body: data.body || data.notification?.body || notificationOptions.body,
        icon: data.icon || notificationOptions.icon,
        badge: data.badge || notificationOptions.badge,
        tag: data.tag || data.data?.notificationId || notificationOptions.tag,
        data: data.data || data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
      };
    } catch (e) {
      // Si no es JSON, intentar como texto
      const text = event.data.text();
      notificationOptions.body = text || notificationOptions.body;
      console.log('[firebase-messaging-sw.js] Push data (texto):', text);
    }
  }

  // Notificar a todos los clientes activos
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'NOTIFICATION_RECEIVED',
          payload: {
            notification: {
              title: notificationTitle,
              body: notificationOptions.body
            },
            data: notificationOptions.data
          }
        });
      });
    }).catch((error) => {
      console.error('[firebase-messaging-sw.js] Error notificando clientes en push:', error);
    })
  );

  // Mostrar la notificación
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Manejar eventos de background sync
self.addEventListener('sync', (event) => {
  console.log('[firebase-messaging-sw.js] Evento sync recibido:', event.tag);
  
  if (event.tag === 'sync-notifications' || event.tag.startsWith('sync-')) {
    event.waitUntil(
      // Aquí puedes agregar lógica para sincronizar datos en background
      // Por ejemplo, sincronizar notificaciones no leídas
      self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'SYNC_REQUESTED',
            tag: event.tag
          });
        });
      }).catch((error) => {
        console.error('[firebase-messaging-sw.js] Error en sync:', error);
      })
    );
  }
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
