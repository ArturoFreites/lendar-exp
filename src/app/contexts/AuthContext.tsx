import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createApiService, AuthResponse } from '../services/api';
import { initializeFirebase, initializeMessaging, getFCMToken, getPlatform } from '../services/firebase';
import { toast } from 'sonner';

// Importar useErrorSafe de forma segura
let useErrorSafe: (() => { showError: (error: any) => void } | null) | null = null;
try {
  const errorContextModule = require('./ErrorContext');
  useErrorSafe = errorContextModule.useErrorSafe;
} catch {
  // ErrorContext no disponible
}

export type Environment = 'production' | 'development';

interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  roles: string[];
  confirmEmail: boolean;
}

interface AuthContextType {
  user: User | null;
  environment: Environment;
  apiUrl: string;
  login: (email: string, password: string, env: Environment) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  apiService: ReturnType<typeof createApiService> | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URLS: Record<Environment, string> = {
  production: import.meta.env.VITE_API_URL_PROD || 'https://api.empresa.com',
  development: import.meta.env.VITE_API_URL_DEV || 'http://localhost:8080',
};

const STORAGE_KEYS = {
  USER: 'lendar_user',
  ENVIRONMENT: 'lendar_environment',
  API_URL: 'lendar_api_url',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Intentar obtener el contexto de errores de forma segura
  const errorContext = useErrorSafe ? useErrorSafe() : null;
  const showError = errorContext?.showError || null;

  // Cargar estado inicial desde localStorage
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [environment, setEnvironment] = useState<Environment>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENVIRONMENT);
      return (stored as Environment) || 'development';
    } catch {
      return 'development';
    }
  });
  const [apiUrl, setApiUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_URL);
      return stored || API_URLS.development;
    } catch {
      return API_URLS.development;
    }
  });
  const [apiService, setApiService] = useState<ReturnType<typeof createApiService> | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_URL);
      return stored ? createApiService(stored) : null;
    } catch {
      return null;
    }
  });

  // Inicializar Firebase al montar
  useEffect(() => {
    initializeFirebase();
    initializeMessaging();
  }, []);

  // Persistir cambios en localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENVIRONMENT, environment);
  }, [environment]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.API_URL, apiUrl);
  }, [apiUrl]);

  /**
   * Obtiene el token FCM con timeout y manejo de errores
   * @param timeoutMs Tiempo máximo de espera en milisegundos (default: 15000)
   * @param required Si es true, lanza error si no se puede obtener (default: true)
   * @returns Token FCM o null si no se pudo obtener (solo si required=false)
   * @throws Error si required=true y no se pudo obtener el token
   */
  const getFCMTokenWithTimeout = async (
    timeoutMs: number = 15000,
    required: boolean = true
  ): Promise<string | null> => {
    console.log('🔔 [FCM] Iniciando obtención de token FCM (OBLIGATORIO)...');
    console.log('🔔 [FCM] Timeout:', timeoutMs, 'ms');
    
    try {
      // Crear una promesa con timeout
      const tokenPromise = getFCMToken();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const error = new Error(`Timeout obteniendo token FCM después de ${timeoutMs}ms`);
          console.error('⏱️ [FCM]', error.message);
          reject(error);
        }, timeoutMs);
      });

      // Esperar a que termine cualquiera de las dos promesas
      const token = await Promise.race([tokenPromise, timeoutPromise]);
      
      if (token) {
        console.log('✅ [FCM] Token FCM obtenido exitosamente:', token.substring(0, 30) + '...');
        console.log('✅ [FCM] Longitud:', token.length);
        return token;
      } else {
        const error = new Error('No se pudo obtener token FCM (retornó null)');
        console.error('❌ [FCM]', error.message);
        if (required) {
          throw error;
        }
        return null;
      }
    } catch (error) {
      console.error('❌ [FCM] Error obteniendo token FCM:', error);
      if (error instanceof Error) {
        console.error('❌ [FCM]   Tipo:', error.constructor.name);
        console.error('❌ [FCM]   Mensaje:', error.message);
        if (error.stack) {
          console.error('❌ [FCM]   Stack:', error.stack);
        }
      }
      
      if (required) {
        throw new Error(
          'No se pudo obtener el token FCM. ' +
          'Verifica que las notificaciones estén habilitadas y que el Service Worker esté funcionando correctamente.'
        );
      }
      
      // Si no es requerido, retornar null en lugar de lanzar el error
      console.warn('⚠️ [FCM] Token FCM no obtenido (no requerido), retornando null');
      return null;
    }
  };

  const login = async (email: string, password: string, env: Environment) => {
    console.log('🔐 [LOGIN] Iniciando proceso de login...');
    console.log('🔐 [LOGIN] Email:', email);
    console.log('🔐 [LOGIN] Environment:', env);
    
    try {
      // 1. Configurar API Service primero
      const baseUrl = API_URLS[env];
      const service = createApiService(baseUrl);
      setApiService(service);
      setApiUrl(baseUrl);
      
      console.log('🔐 [LOGIN] API Service creado, baseUrl:', baseUrl);

      // 2. Realizar login SIN FCM (no bloqueante)
      console.log('📤 [LOGIN] Enviando request de login...');
      const response = await service.login(email, password);
      console.log('📥 [LOGIN] Respuesta recibida, código:', response.code);

      // 3. Procesar respuesta
      if (response.code === 200 && response.data) {
        const authData: AuthResponse = response.data;
        console.log('✅ [LOGIN] Login exitoso');
        console.log('✅ [LOGIN] Usuario:', authData.email);
        console.log('✅ [LOGIN] ID:', authData.id);
        
        setUser({
          id: authData.id,
          name: authData.name,
          lastName: authData.lastName,
          email: authData.email,
          roles: authData.roles,
          confirmEmail: authData.confirmEmail,
        });
        setEnvironment(env);
        
        toast.success('¡Bienvenido al sistema!');

        // 4. Registrar FCM después del login (no bloqueante, como petición normal)
        // Ejecutar de forma asíncrona sin await para no bloquear, pero capturar errores
        registerFcmTokenAfterLogin(service).catch((err) => {
          console.error('❌ [FCM] Error no capturado en registerFcmTokenAfterLogin:', err);
        });
      } else {
        console.error('❌ [LOGIN] Error en respuesta:', response.message);
        throw new Error(response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('❌ [LOGIN] Error en proceso de login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error(errorMessage);
      throw error;
    }
  };

  /**
   * Registra el token FCM después del login (similar a login, pero no bloqueante)
   * Se ejecuta como una petición normal usando el mismo servicio API
   */
  const registerFcmTokenAfterLogin = async (service: ReturnType<typeof createApiService>) => {
    console.log('🔔 [FCM] Iniciando registro de token FCM después del login...');
    
    try {
      // Pequeño delay para asegurar que Firebase esté completamente inicializado
      console.log('🔔 [FCM] Esperando inicialización de Firebase...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔔 [FCM] Intentando obtener token FCM...');
      
      // Intentar obtener token FCM con timeout y no requerido
      let fcmToken: string | null = null;
      try {
        fcmToken = await getFCMTokenWithTimeout(10000, false);
      } catch (err) {
        console.warn('⚠️ [FCM] Error obteniendo token:', err);
        fcmToken = null;
      }
      
      if (!fcmToken) {
        console.warn('⚠️ [FCM] No se pudo obtener token FCM, se registrará más tarde');
        return;
      }

      console.log('✅ [FCM] Token FCM obtenido:', fcmToken.substring(0, 30) + '...');
      console.log('🔔 [FCM] Preparando petición al backend (igual que login)...');
      
      // Registrar token FCM en el backend con platform (igual que login)
      const platform = getPlatform();
      const deviceLabel = navigator.userAgent || 'Unknown Device';
      
      console.log('🔔 [FCM] Datos a enviar:', {
        fcmToken: fcmToken.substring(0, 30) + '...',
        platform,
        deviceLabel: deviceLabel.substring(0, 50) + '...'
      });
      
      console.log('📤 [FCM] Enviando petición POST a /backoffice/api/user/fcm-token');
      console.log('📤 [FCM] Usando el mismo servicio API que login');
      
      // Llamar directamente al método del servicio, igual que login
      // Esta es la misma forma que se hace login: service.login()
      const response = await service.registerFcmToken({ 
        fcmToken,
        platform,
        deviceLabel
      });
      
      console.log('✅ [FCM] Respuesta del backend recibida:', response);
      console.log('✅ [FCM] Código de respuesta:', response.code);
      console.log('✅ [FCM] Mensaje:', response.message);
      console.log('✅ [FCM] Token FCM registrado exitosamente en el backend');
    } catch (error: any) {
      console.error('❌ [FCM] Error registrando token FCM:', error);
      console.error('❌ [FCM] Tipo de error:', error?.constructor?.name);
      console.error('❌ [FCM] Detalles del error:', {
        message: error?.message,
        code: error?.code,
        errors: error?.errors,
        stack: error?.stack
      });
      
      // Mostrar error específico para FCM
      const errorInfo = {
        title: 'Error al registrar notificaciones push',
        message: error?.message || 'No se pudo registrar el token FCM. Las notificaciones push pueden no funcionar correctamente. Puedes intentar recargar la página.',
        code: error?.code,
        errors: error?.errors,
      };
      
      if (showError) {
        showError(errorInfo);
      } else {
        toast.error(errorInfo.message);
      }
    }
  };

  const logout = async () => {
    try {
      // Llamar al endpoint de logout del backend si hay servicio configurado
      if (apiService) {
        console.log('🔐 [LOGOUT] Cerrando sesión en el backend...');
        try {
          await apiService.logout();
          console.log('✅ [LOGOUT] Sesión cerrada en el backend');
        } catch (error) {
          console.error('⚠️ [LOGOUT] Error al cerrar sesión en el backend (continuando con limpieza local):', error);
        }
      }
    } catch (error) {
      console.error('⚠️ [LOGOUT] Error en proceso de logout:', error);
    } finally {
      // Limpiar estado local siempre, incluso si falla el logout en el backend
      setUser(null);
      setEnvironment('development');
      setApiUrl(API_URLS.development);
      setApiService(null);
      // Limpiar localStorage
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.ENVIRONMENT);
      localStorage.removeItem(STORAGE_KEYS.API_URL);
      // Limpiar cookies
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh_token=; path=/backoffice/api/auth; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      console.log('✅ [LOGOUT] Estado local limpiado');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        environment,
        apiUrl,
        login,
        logout,
        isAuthenticated: !!user,
        apiService,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
