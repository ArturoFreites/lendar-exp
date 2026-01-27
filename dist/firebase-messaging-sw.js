// Importar los scripts de Firebase
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Configuración de Firebase - se recibe desde el cliente principal
let firebaseConfig = null;
let firebaseInitialized = false;
let messaging = null;

// Función para inicializar Firebase
function initializeFirebase(config) {
  if (firebaseInitialized) {
    console.log('[SW] Firebase ya está inicializado');
    return;
  }

  if (!config || !config.apiKey) {
    console.error('[SW] ❌ Configuración de Firebase inválida');
    return;
  }

  try {
    firebase.initializeApp(config);
    firebaseInitialized = true;
    messaging = firebase.messaging();
    
    // Registrar onBackgroundMessage DESPUÉS de inicializar messaging
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] Mensaje recibido en background:', payload);
      
      const notificationTitle = payload.notification?.title || payload.data?.title || 'Nueva notificación';
      const notificationBody = payload.notification?.body || payload.data?.message || '';
      
      const notificationOptions = {
        body: notificationBody,
        icon: '/icon.png',
        badge: '/badge.png',
        tag: payload.data?.notificationId || 'default',
        data: payload.data || {},
        requireInteraction: false,
        silent: false,
      };

      // Notificar a clientes activos
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_RECEIVED',
            payload: payload
          }).catch(() => {});
        });
      }).catch(() => {});

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
    console.log('[SW] ✅ Firebase inicializado correctamente');
  } catch (error) {
    console.error('[SW] ❌ Error inicializando Firebase:', error);
  }
}

// Escuchar mensajes del cliente principal
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);
  const { type, data } = event.data || {};

  // Recibir configuración de Firebase desde el cliente
  if (type === 'INIT_FIREBASE' && data) {
    console.log('[SW] Recibiendo configuración de Firebase...');
    firebaseConfig = data;
    initializeFirebase(data);
  }

  // Ping para verificar estado
  if (type === 'PING_FIREBASE') {
    if (event.ports && event.ports.length > 0) {
      try {
        event.ports[0].postMessage({
          type: 'FIREBASE_READY',
          initialized: firebaseInitialized,
          hasMessaging: !!messaging
        });
      } catch (error) {
        console.error('[SW] ❌ Error respondiendo PING:', error);
      }
    }
  }
});

// Manejar eventos push (Firebase los maneja automáticamente, pero mantenemos este como fallback)
self.addEventListener('push', (event) => {
  // Firebase Messaging maneja esto automáticamente si está inicializado
  // Este es solo un fallback
  if (!firebaseInitialized) {
    let notificationTitle = 'Nueva notificación';
    let notificationOptions = {
      body: 'Has recibido una notificación push',
      icon: '/icon.png',
      badge: '/badge.png',
      tag: 'push-notification',
      data: {},
    };

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
        };
      } catch (e) {
        notificationOptions.body = event.data.text() || notificationOptions.body;
      }
    }

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.deepLink || '/';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
