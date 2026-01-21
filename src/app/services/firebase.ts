import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging, onMessage, isSupported } from 'firebase/messaging';

// Configuración de Firebase desde variables de entorno
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

// Inicializar Firebase
export const initializeFirebase = (): FirebaseApp | null => {
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase inicializado');
      return app;
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error);
      return null;
    }
  }
  return getApps()[0];
};

// Inicializar Firebase Messaging
export const initializeMessaging = async (): Promise<Messaging | null> => {
  if (messaging) {
    return messaging;
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers no soportados');
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    console.warn('⚠️ Firebase Messaging no soportado');
    return null;
  }

  try {
    if (!app) {
      initializeFirebase();
    }
    messaging = getMessaging(app!);
    console.log('✅ Firebase Messaging inicializado');
    return messaging;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Messaging:', error);
    return null;
  }
};

// Obtener token FCM - Patrón básico simplificado
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Verificar requisitos básicos
    if (typeof window === 'undefined') {
      throw new Error('No se puede obtener el token FCM fuera de un navegador');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers no están soportados en este navegador');
    }

    // Verificar HTTPS (excepto localhost)
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.');
    
    if (window.location.protocol !== 'https:' && !isLocalhost) {
      throw new Error('Las notificaciones push requieren HTTPS en producción');
    }

    // Verificar VAPID key
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey.trim() === '') {
      throw new Error('VAPID key no configurada (VITE_FIREBASE_VAPID_KEY). Verifica tu archivo .env o variables de entorno.');
    }

    const trimmedKey = vapidKey.trim();
    if (trimmedKey.length < 80) {
      throw new Error(`VAPID key parece inválida (muy corta: ${trimmedKey.length} caracteres). Debe tener al menos 80 caracteres.`);
    }

    console.log('🔑 VAPID key detectada:', trimmedKey.substring(0, 20) + '... (longitud: ' + trimmedKey.length + ')');

    // 1. Solicitar permisos primero
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permisos de notificaciones no concedidos. Habilítalos en la configuración del navegador.');
    }

    // 2. Registrar Service Worker explícitamente
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    console.log('✅ Service Worker registrado:', registration.scope);

    // 3. Enviar configuración al Service Worker (para background messages)
    if (registration.active) {
      registration.active.postMessage({
        type: 'INIT_FIREBASE',
        data: firebaseConfig
      });
      console.log('✅ Configuración enviada al Service Worker');
    }

    // 4. Inicializar Firebase
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      throw new Error('Firebase no se pudo inicializar');
    }

    // 5. Inicializar Messaging
    const messagingInstance = getMessaging(firebaseApp);
    if (!messagingInstance) {
      throw new Error('Firebase Messaging no se pudo inicializar');
    }

    // 6. Obtener token pasando el serviceWorkerRegistration
    try {
      const token = await getToken(messagingInstance, {
        vapidKey: trimmedKey,
        serviceWorkerRegistration: registration
      });
      
      if (token) {
        console.log('✅ Token FCM obtenido exitosamente:', token.substring(0, 30) + '...');
        return token;
      }

      throw new Error('No se pudo obtener el token FCM (retornó null)');
    } catch (tokenError: any) {
      // Mejorar mensajes de error específicos
      const errorMessage = tokenError?.message || '';
      const errorCode = tokenError?.code || '';
      
      if (errorMessage.includes('applicationServerKey') || 
          errorMessage.includes('not valid') ||
          errorCode === 'messaging/invalid-vapid-key') {
        throw new Error(
          'VAPID key inválida. ' +
          'Verifica que VITE_FIREBASE_VAPID_KEY esté configurada correctamente en tu archivo .env. ' +
          'La key debe obtenerse de Firebase Console > Cloud Messaging > Web Push certificates.'
        );
      }
      
      if (errorMessage.includes('push service error') || 
          errorMessage.includes('Registration failed')) {
        throw new Error(
          'Error del servicio push de Firebase. ' +
          'Verifica en Google Cloud Console que la "Firebase Cloud Messaging API" esté habilitada. ' +
          'Ve a: https://console.cloud.google.com/apis/library/fcm.googleapis.com ' +
          'y haz clic en "ENABLE". ' +
          'Luego espera 2-3 minutos y vuelve a intentar.'
        );
      }
      
      throw tokenError;
    }
  } catch (error) {
    console.error('❌ Error obteniendo token FCM:', error);
    throw error;
  }
};

// Escuchar mensajes en foreground
export const onMessageListener = async (callback: (payload: any) => void) => {
  try {
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance) {
      return () => {};
    }

    return onMessage(messagingInstance, (payload) => {
      console.log('📨 Mensaje recibido en foreground:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('❌ Error configurando onMessageListener:', error);
    return () => {};
  }
};

// Obtener plataforma
export const getPlatform = (): string => {
  if (typeof window === 'undefined') return 'WEB';
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  if (/android/i.test(userAgent)) return 'ANDROID';
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return 'IOS';
  return 'WEB';
};
