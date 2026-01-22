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

// Obtener token FCM - Patrón simplificado (similar al blog)
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Verificar requisitos básicos
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('Service Workers no están soportados');
    }

    // Verificar VAPID key
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
    if (!vapidKey) {
      throw new Error('VAPID key no configurada (VITE_FIREBASE_VAPID_KEY)');
    }

    // 1. Solicitar permisos
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permisos de notificaciones no concedidos');
    }

    // 2. Registrar Service Worker y enviar configuración
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    
    // Enviar configuración al SW
    if (registration.active) {
      registration.active.postMessage({
        type: 'INIT_FIREBASE',
        data: firebaseConfig
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 3. Inicializar Firebase y Messaging
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      throw new Error('Firebase no se pudo inicializar');
    }

    const messagingInstance = getMessaging(firebaseApp);

    // 4. Obtener token (patrón del blog)
    const token = await getToken(messagingInstance, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('✅ Token FCM obtenido:', token.substring(0, 30) + '...');
      return token;
    }

    throw new Error('No se pudo obtener el token FCM');
  } catch (error: any) {
    console.error('❌ Error obteniendo token FCM:', error);
    
    // Mensajes de error mejorados
    if (error?.message?.includes('push service error') || 
        error?.message?.includes('Registration failed')) {
      throw new Error(
        'Error del servicio push. Verifica que la "Firebase Cloud Messaging API" esté habilitada en Google Cloud Console.'
      );
    }
    
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
