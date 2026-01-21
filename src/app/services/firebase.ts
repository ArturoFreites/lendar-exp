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

/**
 * Verifica todos los requisitos previos para obtener el token FCM en web/desktop
 * @returns Objeto con el resultado de la verificación y mensaje de error si aplica
 */
const verifyFCMRequirements = (): { valid: boolean; error?: string; details?: string[] } => {
  const errors: string[] = [];
  
  // 1. Verificar que estamos en un navegador
  if (typeof window === 'undefined') {
    return {
      valid: false,
      error: 'No se puede obtener el token FCM fuera de un navegador',
      details: ['El código se está ejecutando en un entorno que no es un navegador (SSR)']
    };
  }

  // 2. Verificar Service Worker soportado
  if (!('serviceWorker' in navigator)) {
    errors.push('Service Workers no están soportados en este navegador');
  }

  // 3. Verificar HTTPS (requerido para push en producción)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.startsWith('192.168.');
  const isHttps = window.location.protocol === 'https:';
  
  if (!isHttps && !isLocalhost) {
    errors.push(`Las notificaciones push requieren HTTPS. Protocolo actual: ${window.location.protocol}`);
  }

  // 4. Verificar VAPID key
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey || vapidKey.trim() === '') {
    errors.push('VAPID key no configurada (VITE_FIREBASE_VAPID_KEY)');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: 'Requisitos no cumplidos para notificaciones push',
      details: errors
    };
  }

  return { valid: true };
};

export const getFCMToken = async (): Promise<string | null> => {
  console.log('🚀 [FCM] getFCMToken() llamado');
  
  try {
    // 1. Verificar requisitos previos
    console.log('🔍 [FCM] Verificando requisitos para web/desktop...');
    const requirements = verifyFCMRequirements();
    
    if (!requirements.valid) {
      console.error('❌ [FCM] Requisitos no cumplidos:', requirements.error);
      if (requirements.details) {
        requirements.details.forEach(detail => console.error('❌ [FCM]   -', detail));
      }
      throw new Error(
        requirements.error + 
        (requirements.details ? '\n' + requirements.details.join('\n') : '')
      );
    }
    console.log('✅ [FCM] Requisitos básicos cumplidos');

    // 2. Verificar que estamos en un navegador (ya verificado arriba, pero para logs)
    console.log('✅ [FCM] Estamos en un navegador');

    // 3. Verificar HTTPS (requerido para push)
    console.log('🔍 [FCM] Verificando protocolo...');
    console.log('🔍 [FCM]   Protocolo:', window.location.protocol);
    console.log('🔍 [FCM]   Hostname:', window.location.hostname);
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    if (window.location.protocol !== 'https:' && !isLocalhost) {
      const error = new Error(
        'Las notificaciones push requieren HTTPS en producción.\n' +
        `Protocolo actual: ${window.location.protocol}\n` +
        'Por favor, accede a la aplicación usando HTTPS.'
      );
      console.error('❌ [FCM]', error.message);
      throw error;
    }
    console.log('✅ [FCM] Protocolo válido para push');

    // 3. Inicializar Firebase primero
    console.log('🔧 [FCM] Inicializando Firebase...');
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      console.error('❌ [FCM] Firebase no se pudo inicializar');
      return null;
    }
    console.log('✅ [FCM] Firebase inicializado');

    // 4. Verificar que el service worker esté listo Y Firebase inicializado en SW
    console.log('🔧 [FCM] Verificando Service Worker y Firebase...');
    const swReady = await waitForServiceWorker();
    if (!swReady) {
      console.error('❌ [FCM] Service Worker no está listo o Firebase no está inicializado en SW.');
      console.error('❌ [FCM]   Verifica:');
      console.error('❌ [FCM]   1. Que el script inject-sw-env.js se ejecutó correctamente');
      console.error('❌ [FCM]   2. Que las variables de entorno están configuradas');
      console.error('❌ [FCM]   3. Que firebase-messaging-sw.js tiene la configuración correcta');
      console.error('❌ [FCM]   4. Revisa la consola del Service Worker en DevTools > Application > Service Workers');
      return null;
    }

    // 5. Inicializar Firebase Messaging
    console.log('🔧 [FCM] Inicializando Firebase Messaging...');
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance) {
      console.error('❌ [FCM] Firebase Messaging no se pudo inicializar');
      return null;
    }
    console.log('✅ [FCM] Firebase Messaging inicializado');

    // 6. Verificar VAPID key
    console.log('🔍 [FCM] Verificando VAPID key...');
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey.trim() === '') {
      console.error('❌ [FCM] VAPID key no configurada en VITE_FIREBASE_VAPID_KEY.');
      console.error('❌ [FCM]   Verifica tu archivo .env o variables de entorno en Vercel');
      console.error('❌ [FCM]   import.meta.env.VITE_FIREBASE_VAPID_KEY:', import.meta.env.VITE_FIREBASE_VAPID_KEY);
      return null;
    }
    console.log('✅ [FCM] VAPID key encontrada:', vapidKey.substring(0, 20) + '...');

    // 7. Verificar y solicitar permiso para notificaciones
    console.log('🔔 [FCM] Verificando permisos de notificaciones...');
    
    // Verificar el estado actual del permiso
    let permission = Notification.permission;
    console.log('📋 [FCM] Estado actual del permiso:', permission);
    
    if (permission === 'denied') {
      const error = new Error(
        'Los permisos de notificaciones están bloqueados.\n\n' +
        'Para habilitar las notificaciones:\n' +
        '1. Haz clic en el ícono de candado 🔒 en la barra de direcciones\n' +
        '2. Busca "Notificaciones" y cámbialo a "Permitir"\n' +
        '3. Recarga la página e intenta nuevamente'
      );
      console.error('❌ [FCM] Permisos bloqueados por el usuario');
      throw error;
    }
    
    // Si el permiso no está concedido, solicitarlo
    if (permission !== 'granted') {
      console.log('🔔 [FCM] Solicitando permiso para notificaciones...');
      permission = await Notification.requestPermission();
      console.log('📋 [FCM] Respuesta del usuario:', permission);
      
      if (permission === 'denied') {
        const error = new Error(
          'Has denegado los permisos de notificaciones.\n\n' +
          'Para continuar, necesitas permitir las notificaciones:\n' +
          '1. Haz clic en el ícono de candado 🔒 en la barra de direcciones\n' +
          '2. Busca "Notificaciones" y cámbialo a "Permitir"\n' +
          '3. Recarga la página e intenta nuevamente'
        );
        console.error('❌ [FCM] Usuario denegó los permisos');
        throw error;
      }
      
      if (permission !== 'granted') {
        const error = new Error(
          'No se pudo obtener el permiso para notificaciones.\n\n' +
          'Estado: ' + permission + '\n\n' +
          'Por favor, intenta nuevamente o habilita las notificaciones manualmente en la configuración del navegador.'
        );
        console.error('❌ [FCM] Permiso no concedido:', permission);
        throw error;
      }
    }
    
    console.log('✅ [FCM] Permisos de notificaciones concedidos');

    // 8. Obtener token FCM con reintentos
    console.log('🔑 [FCM] Obteniendo token FCM...');
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
      const error = new Error(
        'No se pudo obtener el token FCM después de ' + maxAttempts + ' intentos.\n\n' +
        'Posibles causas:\n' +
        '1. Service Worker no configurado correctamente\n' +
        '2. VAPID key incorrecta o no configurada\n' +
        '3. Problemas con la configuración de Firebase en el Service Worker\n' +
        '4. Firebase no inicializado correctamente en el Service Worker\n\n' +
        'Solución:\n' +
        '- Abre DevTools (F12) > Application > Service Workers\n' +
        '- Verifica que el Service Worker esté activo\n' +
        '- Revisa la consola del Service Worker para errores\n' +
        '- Verifica que las variables de entorno estén configuradas correctamente'
      );
      console.error('❌ [FCM]', error.message);
      throw error;
    }
    
    return token;
  } catch (error) {
    console.error('❌ [FCM] Error obteniendo token FCM:', error);
    
    // Si el error ya tiene un mensaje descriptivo, lanzarlo tal cual
    if (error instanceof Error && error.message.includes('\n')) {
      throw error;
    }
    
    // Mejorar mensajes de error específicos de Firebase
    if (error instanceof Error) {
      console.error('❌ [FCM]   Tipo:', error.constructor.name);
      console.error('❌ [FCM]   Mensaje:', error.message);
      
      let enhancedError: Error;
      
      if (error.message.includes('messaging/registration-token-not-registered') || 
          (error as any).code === 'messaging/failed-service-worker-registration') {
        enhancedError = new Error(
          'El Service Worker no está registrado correctamente.\n\n' +
          'Solución:\n' +
          '1. Verifica que firebase-messaging-sw.js existe en la carpeta public/\n' +
          '2. Asegúrate de que el Service Worker esté activo (DevTools > Application > Service Workers)\n' +
          '3. Recarga la página completamente (Ctrl+Shift+R o Cmd+Shift+R)\n' +
          '4. Verifica que las variables de entorno estén configuradas'
        );
      } else if (error.message.includes('messaging/invalid-vapid-key') || 
                 (error as any).code === 'messaging/invalid-vapid-key') {
        enhancedError = new Error(
          'La VAPID key es inválida o no está configurada.\n\n' +
          'Solución:\n' +
          '1. Verifica que VITE_FIREBASE_VAPID_KEY esté configurada en tus variables de entorno\n' +
          '2. Obtén la VAPID key desde Firebase Console > Project Settings > Cloud Messaging > Web Push certificates\n' +
          '3. Asegúrate de que la key sea correcta y esté completa'
        );
      } else {
        enhancedError = new Error(
          'Error al obtener el token de notificaciones: ' + error.message + '\n\n' +
          'Por favor, verifica:\n' +
          '1. Que las notificaciones estén habilitadas en tu navegador\n' +
          '2. Que el Service Worker esté funcionando correctamente\n' +
          '3. Que la conexión a internet esté estable\n' +
          '4. Intenta recargar la página completamente'
        );
      }
      
      throw enhancedError;
    }
    
    throw error;
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
