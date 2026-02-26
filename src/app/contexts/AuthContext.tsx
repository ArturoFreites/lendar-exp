import React, { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback } from 'react';
import { createApiService } from '../services/api';
import { createLoginUseCase } from '../usecases/login.usecase';
import { initializeFirebase, initializeMessaging, getFCMToken, getPlatform } from '../services/firebase';
import { registerSessionInvalidHandler, unregisterSessionInvalidHandler } from '../utils/sessionInvalidHandler';
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

/** Fallback when BE does not send TTL (e.g. restored session before first refresh). */
const DEFAULT_ACCESS_TTL_SECONDS = 15 * 60;
/** Minimal margin so we refresh just before BE expiry; timing is driven by BE expiresInSeconds. */
const REFRESH_MARGIN_SECONDS = 5;
/** On restored session, call refresh once after this delay to get expiresInSeconds from BE, then schedule from that. */
const RESTORED_SESSION_REFRESH_DELAY_MS = 45 * 1000;

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
      if (stored === 'local') return 'development';
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

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduledFromLoginRef = useRef(false);

  const clearSession = useCallback(() => {
    scheduledFromLoginRef.current = false;
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    setUser(null);
    setEnvironment('development');
    setApiUrl(API_URLS.development);
    setApiService(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ENVIRONMENT);
    localStorage.removeItem(STORAGE_KEYS.API_URL);
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/backoffice/api/auth; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }, []);

  /** Schedules next refresh using only BE timing (expiresInSeconds). Restored session (ttl<=0) triggers one sync refresh to get TTL from BE. */
  const scheduleProactiveRefresh = useCallback(
    (service: ReturnType<typeof createApiService>, accessTtlSeconds: number) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      const delayMs =
        accessTtlSeconds <= 0
          ? RESTORED_SESSION_REFRESH_DELAY_MS
          : Math.max(1000, (accessTtlSeconds - REFRESH_MARGIN_SECONDS) * 1000);

      refreshTimerRef.current = setTimeout(async () => {
        refreshTimerRef.current = null;
        try {
          const result = await service.refreshSession();
          if (result.success && result.expiresInSeconds != null) {
            scheduleProactiveRefresh(service, result.expiresInSeconds);
          } else {
            await service.logoutOnBackend();
            clearSession();
          }
        } catch {
          await service.logoutOnBackend().catch(() => {});
          clearSession();
        }
      }, delayMs);
    },
    [clearSession]
  );

  useEffect(() => {
    initializeFirebase();
    initializeMessaging();
  }, []);

  useEffect(() => {
    registerSessionInvalidHandler(clearSession);
    return () => unregisterSessionInvalidHandler();
  }, [clearSession]);

  useEffect(() => {
    if (!user || !apiService || scheduledFromLoginRef.current) return;
    scheduleProactiveRefresh(apiService, 0);
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [user, apiService, scheduleProactiveRefresh]);

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
    try {
      const tokenPromise = getFCMToken();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout obteniendo token FCM después de ${timeoutMs}ms`));
        }, timeoutMs);
      });

      const token = await Promise.race([tokenPromise, timeoutPromise]);

      if (token) {
        return token;
      }
      const error = new Error('No se pudo obtener token FCM (retornó null)');
      if (required) {
        throw error;
      }
      return null;
    } catch (error) {
      if (required) {
        throw new Error(
          'No se pudo obtener el token FCM. ' +
          'Verifica que las notificaciones estén habilitadas y que el Service Worker esté funcionando correctamente.'
        );
      }
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

      const loginUseCase = createLoginUseCase(service);
      console.log('📤 [LOGIN] Enviando request de login...');
      const result = await loginUseCase.execute(email, password);
      console.log('📥 [LOGIN] Respuesta recibida');

      if (result.success) {
        console.log('✅ [LOGIN] Login exitoso');
        console.log('✅ [LOGIN] Usuario:', result.user.email);
        console.log('✅ [LOGIN] ID:', result.user.id);

        setUser({
          id: result.user.id,
          name: result.user.name,
          lastName: result.user.lastName,
          email: result.user.email,
          roles: result.user.roles,
          confirmEmail: result.user.confirmEmail,
        });
        setEnvironment(env);

        const ttl = result.accessTokenTtlSeconds ?? DEFAULT_ACCESS_TTL_SECONDS;
        scheduledFromLoginRef.current = true;
        scheduleProactiveRefresh(service, ttl);

        toast.success('¡Bienvenido al sistema!');

        registerFcmTokenAfterLogin(service).catch(() => {});
      } else {
        console.error('❌ [LOGIN] Error en respuesta:', result.errorMessage);
        throw new Error(result.errorMessage);
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
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      let fcmToken: string | null = null;
      try {
        fcmToken = await getFCMTokenWithTimeout(10000, false);
      } catch {
        fcmToken = null;
      }

      if (!fcmToken) {
        return;
      }

      const platform = getPlatform();
      const deviceLabel = navigator.userAgent || 'Unknown Device';

      await service.registerFcmToken({
        fcmToken,
        platform,
        deviceLabel
      });
    } catch (error: any) {
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
      clearSession();
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
