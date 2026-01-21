import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging, onMessage, isSupported } from 'firebase/messaging';

// Configuración de Firebase - reemplaza con tus valores del Paso 1
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'lendar-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export const initializeFirebase = (): FirebaseApp | null => {
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('Firebase inicializado correctamente');
      return app;
    } catch (error) {
      console.error('Error inicializando Firebase:', error);
      return null;
    }
  }
  return getApps()[0];
};

export const initializeMessaging = async (): Promise<Messaging | null> => {
  if (messaging) {
    return messaging;
  }

  // Verificar si el navegador soporta Service Workers
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Este navegador no soporta Service Workers');
    return null;
  }

  // Verificar si Firebase Messaging está soportado
  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging no está soportado en este navegador');
    return null;
  }

  try {
    if (!app) {
      initializeFirebase();
    }
    messaging = getMessaging(app!);
    console.log('Firebase Messaging inicializado');
    return messaging;
  } catch (error) {
    console.error('Error inicializando Firebase Messaging:', error);
    return null;
  }
};

// Verificar que el service worker esté listo Y que Firebase esté inicializado
const waitForServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker no soportado en este navegador');
    return false;
  }

  try {
    // Esperar a que el service worker esté listo
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker listo:', registration.active?.scriptURL);
    
    // Verificar que el service worker esté activo
    if (!registration.active) {
      console.warn('⚠️ Service Worker registrado pero no activo aún');
      // Esperar un poco más
      await new Promise(resolve => setTimeout(resolve, 2000));
      const reg = await navigator.serviceWorker.ready;
      if (!reg.active) {
        console.error('❌ Service Worker no se activó después de esperar');
        return false;
      }
    }

    // Verificar que Firebase esté inicializado en el SW enviando un mensaje
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Timeout esperando confirmación de Firebase en SW');
        console.warn('   Esto puede indicar que Firebase no está inicializado en el Service Worker');
        resolve(false);
      }, 3000);

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.type === 'FIREBASE_READY') {
          clearTimeout(timeout);
          if (event.data.initialized && event.data.hasMessaging) {
            console.log('✅ Firebase confirmado en Service Worker');
            resolve(true);
          } else {
            console.error('❌ Firebase no está inicializado correctamente en Service Worker');
            console.error('   initialized:', event.data.initialized);
            console.error('   hasMessaging:', event.data.hasMessaging);
            console.error('   configValid:', event.data.configValid);
            resolve(false);
          }
        } else {
          clearTimeout(timeout);
          resolve(false);
        }
      };

      messageChannel.port1.onerror = () => {
        clearTimeout(timeout);
        console.error('❌ Error en MessageChannel');
        resolve(false);
      };

      try {
        registration.active?.postMessage(
          { type: 'PING_FIREBASE' },
          [messageChannel.port2]
        );
      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Error enviando mensaje al Service Worker:', error);
        resolve(false);
      }
    });
  } catch (error) {
    console.warn('⚠️ Service Worker no está listo aún, esperando...', error);
    // Esperar un poco y reintentar
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) {
        console.error('❌ Service Worker no se pudo inicializar');
        return false;
      }
      console.log('✅ Service Worker listo después de esperar');
      return true;
    } catch (e) {
      console.error('❌ Service Worker no se pudo inicializar:', e);
      return false;
    }
  }
};

export const getFCMToken = async (): Promise<string | null> => {
  console.log('🚀 getFCMToken() llamado');
  
  try {
    // 1. Verificar que estamos en un navegador
    console.log('🔍 Verificando entorno...');
    if (typeof window === 'undefined') {
      console.warn('⚠️ No estamos en un navegador (SSR)');
      return null;
    }
    console.log('✅ Estamos en un navegador');

    // 2. Verificar HTTPS (requerido para push)
    console.log('🔍 Verificando protocolo...');
    console.log('   Protocolo:', window.location.protocol);
    console.log('   Hostname:', window.location.hostname);
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.error('❌ Push notifications requieren HTTPS (excepto localhost)');
      console.error('   Protocolo actual:', window.location.protocol);
      return null;
    }
    console.log('✅ Protocolo válido para push');

    // 3. Inicializar Firebase primero
    console.log('🔧 Inicializando Firebase...');
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      console.error('❌ Firebase no se pudo inicializar');
      return null;
    }
    console.log('✅ Firebase inicializado');

    // 4. Verificar que el service worker esté listo Y Firebase inicializado en SW
    console.log('🔧 Verificando Service Worker y Firebase...');
    const swReady = await waitForServiceWorker();
    if (!swReady) {
      console.error('❌ Service Worker no está listo o Firebase no está inicializado en SW.');
      console.error('   Verifica:');
      console.error('   1. Que el script inject-sw-env.js se ejecutó correctamente');
      console.error('   2. Que las variables de entorno están configuradas');
      console.error('   3. Que firebase-messaging-sw.js tiene la configuración correcta');
      console.error('   4. Revisa la consola del Service Worker en DevTools > Application > Service Workers');
      return null;
    }

    // 5. Inicializar Firebase Messaging
    console.log('🔧 Inicializando Firebase Messaging...');
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance) {
      console.error('❌ Firebase Messaging no se pudo inicializar');
      return null;
    }
    console.log('✅ Firebase Messaging inicializado');

    // 6. Verificar VAPID key
    console.log('🔍 Verificando VAPID key...');
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey.trim() === '') {
      console.error('❌ VAPID key no configurada en VITE_FIREBASE_VAPID_KEY.');
      console.error('   Verifica tu archivo .env o variables de entorno en Vercel');
      console.error('   import.meta.env.VITE_FIREBASE_VAPID_KEY:', import.meta.env.VITE_FIREBASE_VAPID_KEY);
      return null;
    }
    console.log('✅ VAPID key encontrada:', vapidKey.substring(0, 20) + '...');

    // 7. Solicitar permiso para notificaciones
    console.log('🔔 Solicitando permiso para notificaciones...');
    const permission = await Notification.requestPermission();
    console.log('📋 Permiso de notificaciones:', permission);
    
    if (permission !== 'granted') {
      console.warn('⚠️ Permiso de notificaciones denegado. Estado:', permission);
      console.warn('   El usuario debe permitir notificaciones en la configuración del navegador.');
      return null;
    }

    // 8. Obtener token FCM con reintentos
    console.log('🔑 Obteniendo token FCM...');
    let token: string | null = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!token && attempts < maxAttempts) {
      try {
        token = await getToken(messagingInstance, { vapidKey });
        if (token) {
          console.log('✅ Token FCM obtenido exitosamente');
          return token;
        }
      } catch (error: any) {
        attempts++;
        console.warn(`⚠️ Intento ${attempts}/${maxAttempts} falló:`, error.message || error);
        
        if (error.code === 'messaging/failed-service-worker-registration') {
          console.error('   💡 El service worker no está registrado correctamente');
          // Esperar un poco más y reintentar
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Forzar actualización del service worker
            try {
              const registration = await navigator.serviceWorker.ready;
              await registration.update();
              console.log('🔄 Service Worker actualizado, reintentando...');
            } catch (updateError) {
              console.error('   Error actualizando service worker:', updateError);
            }
          }
        } else if (error.code === 'messaging/invalid-vapid-key') {
          console.error('   💡 La VAPID key es inválida');
          console.error('   💡 Verifica VITE_FIREBASE_VAPID_KEY en tus variables de entorno');
          return null; // No reintentar si la key es inválida
        } else if (error.code === 'messaging/registration-token-not-registered') {
          console.error('   💡 El service worker no está registrado correctamente');
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
    
    if (!token) {
      console.warn('⚠️ getToken() retornó null después de', maxAttempts, 'intentos');
      console.warn('   Esto puede deberse a:');
      console.warn('   - Service Worker no configurado correctamente');
      console.warn('   - VAPID key incorrecta');
      console.warn('   - Problemas con la configuración de Firebase en el SW');
      console.warn('   - Firebase no inicializado en el Service Worker');
      console.warn('   💡 Revisa la consola del Service Worker en DevTools > Application > Service Workers');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error obteniendo token FCM:', error);
    if (error instanceof Error) {
      console.error('   Tipo:', error.constructor.name);
      console.error('   Mensaje:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
      
      // Errores comunes de Firebase
      if (error.message.includes('messaging/registration-token-not-registered') || 
          (error as any).code === 'messaging/failed-service-worker-registration') {
        console.error('   💡 El service worker no está registrado correctamente');
        console.error('   💡 Verifica que firebase-messaging-sw.js existe y tiene la configuración correcta');
      }
      if (error.message.includes('messaging/invalid-vapid-key') || 
          (error as any).code === 'messaging/invalid-vapid-key') {
        console.error('   💡 La VAPID key es inválida');
        console.error('   💡 Verifica VITE_FIREBASE_VAPID_KEY en tus variables de entorno');
      }
    }
    return null;
  }
};

export const onMessageListener = async (callback: (payload: any) => void) => {
  try {
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance) {
      console.warn('Firebase Messaging no está disponible para onMessageListener');
      return () => {};
    }

    return onMessage(messagingInstance, (payload) => {
      console.log('Mensaje recibido en foreground:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error configurando onMessageListener:', error);
    return () => {};
  }
};

export const getPlatform = (): string => {
  if (typeof window === 'undefined') return 'WEB';
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  if (/android/i.test(userAgent)) return 'ANDROID';
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return 'IOS';
  return 'WEB';
};
