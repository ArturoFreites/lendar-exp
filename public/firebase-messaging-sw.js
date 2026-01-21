// Importar los scripts de Firebase (versión compat para service workers)
// Actualizado a versión 11.0.2 para mejor compatibilidad con Firebase 12.x
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

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

// Verificar que la configuración no esté vacía
const configIsValid = firebaseConfig.apiKey && 
                      firebaseConfig.authDomain && 
                      firebaseConfig.projectId && 
                      firebaseConfig.messagingSenderId && 
                      firebaseConfig.appId;

if (!configIsValid) {
  console.error('[firebase-messaging-sw.js] ❌ Configuración de Firebase vacía o inválida');
  console.error('[firebase-messaging-sw.js] Verifica que el script inject-sw-env.js se ejecutó correctamente');
  console.error('[firebase-messaging-sw.js] Config recibida:', firebaseConfig);
}

// Inicializar Firebase
let firebaseInitialized = false;
let messaging = null;

try {
  if (configIsValid) {
    firebase.initializeApp(firebaseConfig);
    firebaseInitialized = true;
    console.log('[firebase-messaging-sw.js] ✅ Firebase inicializado correctamente');
    
    // Obtener instancia de messaging
    messaging = firebase.messaging();
    console.log('[firebase-messaging-sw.js] ✅ Firebase Messaging inicializado');
  } else {
    console.error('[firebase-messaging-sw.js] ❌ No se puede inicializar Firebase - configuración inválida');
  }
} catch (error) {
  console.error('[firebase-messaging-sw.js] ❌ Error inicializando Firebase:', error);
  console.error('[firebase-messaging-sw.js] Stack:', error.stack);
}

// Manejar mensajes en background
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensaje recibido en background:', payload);
    
    try {
      const notificationTitle = payload.notification?.title || payload.data?.title || 'Nueva notificación';
      const notificationBody = payload.notification?.body || payload.data?.message || '';
      
      const notificationOptions = {
        body: notificationBody,
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
          }).catch(err => {
            console.error('[firebase-messaging-sw.js] Error enviando mensaje a cliente:', err);
          });
        });
      }).catch((error) => {
        console.error('[firebase-messaging-sw.js] Error notificando clientes:', error);
      });

      // Mostrar la notificación del sistema
      return self.registration.showNotification(notificationTitle, notificationOptions);
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Error procesando mensaje:', error);
      // Mostrar notificación genérica en caso de error
      return self.registration.showNotification('Nueva notificación', {
        body: 'Has recibido una notificación',
        icon: '/icon.png',
        tag: 'error-fallback'
      });
    }
  });
} else {
  console.warn('[firebase-messaging-sw.js] ⚠️ Firebase Messaging no está disponible - no se pueden recibir mensajes');
}

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

// Escuchar mensajes del cliente para verificación
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido del cliente:', event.data);
  
  if (event.data && event.data.type === 'PING_FIREBASE') {
    const port = event.ports && event.ports[0];
    if (port) {
      port.postMessage({
        type: 'FIREBASE_READY',
        initialized: firebaseInitialized,
        hasMessaging: !!messaging,
        configValid: configIsValid
      });
      console.log('[firebase-messaging-sw.js] ✅ Respondiendo PING_FIREBASE:', {
        initialized: firebaseInitialized,
        hasMessaging: !!messaging,
        configValid: configIsValid
      });
    }
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
