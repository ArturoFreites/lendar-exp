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

  // Verificar soporte del navegador
  if (typeof window === 'undefined') {
    console.warn('⚠️ Firebase Messaging requiere un entorno de navegador');
    return null;
  }

  // Verificar soporte de Service Workers
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers no soportados en este navegador');
    return null;
  }

  // Verificar soporte de Firebase Messaging
  const supported = await isSupported();
  if (!supported) {
    console.warn('⚠️ Firebase Messaging no soportado en este navegador');
    return null;
  }

  try {
    // Inicializar Firebase si no está inicializado
    if (!app) {
      initializeFirebase();
    }
    
    if (!app) {
      throw new Error('Firebase no se pudo inicializar');
    }

    // Inicializar Messaging (Firebase buscará automáticamente firebase-messaging-sw.js en la raíz)
    messaging = getMessaging(app);
    console.log('✅ Firebase Messaging inicializado');
    return messaging;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Messaging:', error);
    return null;
  }
};

/**
 * Obtener token FCM siguiendo las mejores prácticas de Firebase 2024
 * Según documentación: https://firebase.google.com/docs/cloud-messaging/js/client
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // 1. Verificar requisitos básicos
    if (typeof window === 'undefined') {
      throw new Error('Firebase Messaging requiere un entorno de navegador');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers no están soportados en este navegador');
    }

    // 2. Verificar VAPID key (requerida según documentación)
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
    if (!vapidKey) {
      throw new Error('VAPID key no configurada (VITE_FIREBASE_VAPID_KEY). Es requerida para FCM Web.');
    }

    // 3. Solicitar permisos de notificación (requerido antes de getToken)
    // Según documentación: "When you need to retrieve the current registration token 
    // for an app instance, first request notification permissions from the user"
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ Permisos de notificaciones no concedidos. Token FCM no disponible.');
      return null; // Retornar null en lugar de lanzar error (según mejores prácticas)
    }

    // 4. Inicializar Firebase y Messaging
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance) {
      throw new Error('Firebase Messaging no se pudo inicializar');
    }

    // 5. Verificar que existe firebase-messaging-sw.js
    // Firebase buscará automáticamente este archivo en la raíz del dominio
    // Si no existe, getToken fallará con un error claro

    // 6. Obtener token usando el patrón recomendado por Firebase
    // Según documentación: Firebase busca automáticamente firebase-messaging-sw.js
    // Si está en la raíz, no necesitamos pasar serviceWorkerRegistration
    const token = await getToken(messagingInstance, {
      vapidKey: vapidKey,
      // No pasamos serviceWorkerRegistration - Firebase lo busca automáticamente
      // Solo se necesita si el SW está en otra ubicación
    });

    if (token) {
      console.log('✅ Token FCM obtenido:', token.substring(0, 30) + '...');
      return token;
    }

    // Si token es null, significa que no se pudo obtener (permisos, SW no disponible, etc.)
    // Según documentación: "returns a token if permission is granted or rejects the promise if denied"
    // Pero en la práctica, getToken puede retornar null sin rechazar la promesa
    console.warn('⚠️ getToken retornó null. Verifica permisos y Service Worker.');
    return null;
  } catch (error: any) {
    console.error('❌ Error obteniendo token FCM:', error);
    
    // Mensajes de error mejorados según códigos de error comunes
    if (error?.code === 'messaging/permission-blocked') {
      throw new Error('Permisos de notificaciones bloqueados. Por favor, habilítalos en la configuración del navegador.');
    }
    
    if (error?.code === 'messaging/permission-default') {
      throw new Error('Permisos de notificaciones no han sido solicitados aún.');
    }
    
    if (error?.message?.includes('firebase-messaging-sw.js') || 
        error?.message?.includes('Service Worker')) {
      throw new Error(
        'Service Worker no encontrado. Asegúrate de que firebase-messaging-sw.js existe en la raíz del dominio.'
      );
    }
    
    if (error?.message?.includes('push service error') || 
        error?.message?.includes('Registration failed')) {
      throw new Error(
        'Error del servicio push. Verifica que la "Firebase Cloud Messaging API" esté habilitada en Google Cloud Console.'
      );
    }
    
    throw error;
  }
};

/**
 * Verificar y actualizar token FCM si es necesario
 * NOTA: onTokenRefresh está deprecado en el SDK web de Firebase
 * Según mejores prácticas: llamar getToken() periódicamente o cuando sea necesario
 * El token se actualiza automáticamente cuando cambia
 */
export const refreshFCMToken = async (): Promise<string | null> => {
  // Simplemente llamar getToken() nuevamente
  // Firebase maneja automáticamente si el token cambió
  return getFCMToken();
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
