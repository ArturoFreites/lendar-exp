import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { NotificationResponse } from '../services/api';
import { onMessageListener } from '../services/firebase';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  isConnected: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { apiService, isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Refs para evitar memory leaks - Solo FCM y Service Worker
  const fcmUnsubscribeRef = useRef<(() => void) | null>(null);
  const serviceWorkerMessageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // Cargar notificaciones solo al inicio (sin polling)
  const loadNotifications = useCallback(async () => {
    if (!apiService || !isAuthenticated) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getNotifications({ page: '0', size: '20' });
      if (response.code === 200 && response.data) {
        const loadedNotifications = response.data.content || [];
        // Evitar duplicados usando ID real del servidor
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNotifications = loadedNotifications.filter(n => !existingIds.has(n.id));
          // Combinar y ordenar por fecha (más recientes primero)
          const combined = [...newNotifications, ...prev];
          const unique = Array.from(
            new Map(combined.map(n => [n.id, n])).values()
          );
          return unique
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);
        });
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [apiService, isAuthenticated]);

  const markAsRead = useCallback(async (id: number) => {
    if (!apiService) return;

    try {
      const response = await apiService.markNotificationAsRead(id);
      if (response.code === 200) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString(), status: 'READ' } : n)
        );
      }
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      throw error;
    }
  }, [apiService]);

  const markAllAsRead = useCallback(async () => {
    if (!apiService) return;

    const unreadNotifications = notifications.filter(n => !n.readAt);
    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(unreadNotifications.map(n => markAsRead(n.id)));
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  }, [apiService, notifications, markAsRead]);

  // Función para procesar notificaciones recibidas
  const handleNotificationReceived = useCallback((notification: NotificationResponse) => {
    setNotifications(prev => {
      // Evitar duplicados
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        // Actualizar si ya existe
        return prev.map(n => n.id === notification.id ? notification : n);
      }
      
      // Agregar nueva notificación al inicio
      return [notification, ...prev].slice(0, 20);
    });

    // Solo mostrar toast si la notificación no está leída
    if (!notification.readAt) {
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
        action: {
          label: 'Ver',
          onClick: () => {
            window.location.hash = '#notificaciones';
          },
        },
      });
    }
  }, []);

  // FCM para notificaciones push (foreground)
  const setupFCM = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const unsubscribe = await onMessageListener((payload) => {
        console.log('🔔 Notificación FCM recibida:', payload);
        
        // Extraer datos del payload
        const notificationData = payload.data || {};
        const notification: NotificationResponse = {
          id: notificationData.notificationId 
            ? parseInt(notificationData.notificationId) 
            : Date.now(),
          type: notificationData.type || 'INFO',
          title: payload.notification?.title || notificationData.title || 'Nueva notificación',
          message: payload.notification?.body || notificationData.message || '',
          status: 'UNREAD',
          deepLink: notificationData.deepLink || null,
          metadata: notificationData.metadata 
            ? (typeof notificationData.metadata === 'string' 
                ? JSON.parse(notificationData.metadata) 
                : notificationData.metadata)
            : null,
          createdAt: new Date().toISOString(),
          readAt: null,
          sentPushAt: new Date().toISOString(),
          sentEmailAt: null,
        };

        handleNotificationReceived(notification);
      });

      fcmUnsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error configurando FCM:', error);
    }
  }, [isAuthenticated, handleNotificationReceived]);

  // Comunicación con Service Worker (background)
  const setupServiceWorkerListener = useCallback(() => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker no soportado');
      return;
    }

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_RECEIVED') {
        console.log('📱 Notificación recibida desde Service Worker:', event.data.payload);
        const payload = event.data.payload;
        
        try {
          const notification: NotificationResponse = {
            id: payload.data?.notificationId 
              ? parseInt(payload.data.notificationId) 
              : Date.now(),
            type: payload.data?.type || 'INFO',
            title: payload.notification?.title || payload.data?.title || 'Nueva notificación',
            message: payload.notification?.body || payload.data?.message || '',
            status: 'UNREAD',
            deepLink: payload.data?.deepLink || null,
            metadata: payload.data?.metadata 
              ? (typeof payload.data.metadata === 'string'
                  ? JSON.parse(payload.data.metadata)
                  : payload.data.metadata)
              : null,
            createdAt: new Date().toISOString(),
            readAt: null,
            sentPushAt: new Date().toISOString(),
            sentEmailAt: null,
          };

          handleNotificationReceived(notification);
          // Recargar lista cuando la app vuelve a primer plano desde background
          loadNotifications();
        } catch (error) {
          console.error('Error procesando notificación del Service Worker:', error);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    serviceWorkerMessageHandlerRef.current = handler;
  }, [handleNotificationReceived, loadNotifications]);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    if (fcmUnsubscribeRef.current) {
      fcmUnsubscribeRef.current();
      fcmUnsubscribeRef.current = null;
    }
    if (serviceWorkerMessageHandlerRef.current) {
      navigator.serviceWorker?.removeEventListener(
        'message',
        serviceWorkerMessageHandlerRef.current
      );
      serviceWorkerMessageHandlerRef.current = null;
    }
  }, []);

  // Cargar notificaciones al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      cleanup();
    }
  }, [isAuthenticated, loadNotifications, cleanup]);

  // Inicializar SOLO FCM nativo cuando el usuario se autentica
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      cleanup();
      return;
    }

    console.log('🚀 Inicializando notificaciones FCM nativas...');
    
    // Configurar solo FCM y Service Worker (nativo)
    setupFCM();
    setupServiceWorkerListener();

    return cleanup;
  }, [isAuthenticated, user?.id, setupFCM, setupServiceWorkerListener, cleanup]);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isConnected: true, // Siempre "conectado" con FCM nativo
        refreshNotifications: loadNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
