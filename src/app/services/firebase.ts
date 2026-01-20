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

// Verificar que el service worker esté listo
const waitForServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker no soportado en este navegador');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker listo:', registration.active?.scriptURL);
    return true;
  } catch (error) {
    console.warn('⚠️ Service Worker no está listo aún, esperando...');
    // Esperar un poco y reintentar
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker listo después de esperar');
      return true;
    } catch (e) {
      console.error('❌ Service Worker no se pudo inicializar:', e);
      return false;
    }
  }
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    // 1. Verificar que estamos en un navegador
    if (typeof window === 'undefined') {
      console.warn('⚠️ No estamos en un navegador (SSR)');
      return null;
    }

    // 2. Inicializar Firebase primero
    console.log('🔧 Inicializando Firebase...');
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      console.error('❌ Firebase no se pudo inicializar');
      return null;
    }
    console.log('✅ Firebase inicializado');

    // 3. Verificar que el service worker esté listo
    console.log('🔧 Verificando Service Worker...');
    const swReady = await waitForServiceWorker();
    if (!swReady) {
      console.error('❌ Service Worker no está listo. No se puede obtener token FCM.');
      return null;
    }

    // 4. Inicializar Firebase Messaging
    console.log('🔧 Inicializando Firebase Messaging...');
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance) {
      console.error('❌ Firebase Messaging no se pudo inicializar');
      return null;
    }
    console.log('✅ Firebase Messaging inicializado');

    // 5. Verificar VAPID key
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey.trim() === '') {
      console.error('❌ VAPID key no configurada en VITE_FIREBASE_VAPID_KEY. Las notificaciones push no funcionarán.');
      console.error('   Verifica tu archivo .env');
      return null;
    }
    console.log('✅ VAPID key encontrada:', vapidKey.substring(0, 20) + '...');

    // 6. Solicitar permiso para notificaciones
    console.log('🔔 Solicitando permiso para notificaciones...');
    const permission = await Notification.requestPermission();
    console.log('📋 Permiso de notificaciones:', permission);
    
    if (permission !== 'granted') {
      console.warn('⚠️ Permiso de notificaciones denegado. Estado:', permission);
      console.warn('   El usuario debe permitir notificaciones en la configuración del navegador.');
      return null;
    }

    // 7. Obtener token FCM
    console.log('🔑 Obteniendo token FCM...');
    const token = await getToken(messagingInstance, { vapidKey });
    
    if (token) {
      console.log('✅ Token FCM obtenido exitosamente');
      return token;
    } else {
      console.warn('⚠️ getToken() retornó null o undefined');
      console.warn('   Esto puede deberse a:');
      console.warn('   - Service Worker no configurado correctamente');
      console.warn('   - VAPID key incorrecta');
      console.warn('   - Problemas con la configuración de Firebase');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo token FCM:', error);
    if (error instanceof Error) {
      console.error('   Tipo:', error.constructor.name);
      console.error('   Mensaje:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
      
      // Errores comunes de Firebase
      if (error.message.includes('messaging/registration-token-not-registered')) {
        console.error('   💡 El service worker no está registrado correctamente');
      }
      if (error.message.includes('messaging/invalid-vapid-key')) {
        console.error('   💡 La VAPID key es inválida');
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
