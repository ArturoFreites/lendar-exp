import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createApiService, AuthResponse } from '../services/api';
import { initializeFirebase, initializeMessaging, getFCMToken, getPlatform } from '../services/firebase';
import { toast } from 'sonner';

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
  logout: () => void;
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

  const login = async (email: string, password: string, env: Environment) => {
    console.log('🔐 [LOGIN] Iniciando proceso de login...');
    console.log('🔐 [LOGIN] Email:', email);
    console.log('🔐 [LOGIN] Environment:', env);
    
    try {
      const baseUrl = API_URLS[env];
      const service = createApiService(baseUrl);
      setApiService(service);
      setApiUrl(baseUrl);
      
      console.log('🔐 [LOGIN] API Service creado, baseUrl:', baseUrl);

      // Intentar obtener token FCM
      let fcmToken: string | null = null;
      try {
        console.log('🔔 [FCM] Intentando obtener token FCM...');
        console.log('🔔 [FCM] Navegador:', navigator.userAgent);
        console.log('🔔 [FCM] Service Worker soportado:', 'serviceWorker' in navigator);
        console.log('🔔 [FCM] HTTPS:', window.location.protocol === 'https:' || window.location.hostname === 'localhost');
        console.log('🔔 [FCM] URL completa:', window.location.href);
        console.log('🔔 [FCM] Llamando a getFCMToken()...');
        
        fcmToken = await getFCMToken();
        
        console.log('📥 [FCM] getFCMToken() retornó:', fcmToken ? `Token (longitud: ${fcmToken.length})` : 'null');
        
        if (fcmToken) {
          console.log('✅ [FCM] Token FCM obtenido exitosamente');
          console.log('✅ [FCM] Longitud:', fcmToken.length);
          console.log('✅ [FCM] Primeros 50 caracteres:', fcmToken.substring(0, 50) + '...');
        } else {
          console.warn('⚠️ [FCM] No se pudo obtener token FCM (retornó null)');
          console.warn('⚠️ [FCM] Esto puede deberse a:');
          console.warn('⚠️ [FCM]   - VAPID key no configurada');
          console.warn('⚠️ [FCM]   - Permisos de notificaciones denegados');
          console.warn('⚠️ [FCM]   - Service Worker no registrado');
          console.warn('⚠️ [FCM]   - Firebase no inicializado correctamente');
        }
      } catch (error) {
        console.error('❌ [FCM] Error obteniendo token FCM:', error);
        if (error instanceof Error) {
          console.error('   Tipo:', error.constructor.name);
          console.error('   Mensaje:', error.message);
          if (error.stack) {
            console.error('   Stack:', error.stack);
          }
        }
      }

      const platform = getPlatform();
      console.log('📱 [LOGIN] Plataforma detectada:', platform);
      console.log('📤 [LOGIN] Estado del token FCM antes de enviar:');
      console.log('📤 [LOGIN]   - Token existe:', !!fcmToken);
      console.log('📤 [LOGIN]   - Token valor:', fcmToken ? fcmToken.substring(0, 30) + '...' : 'null');
      console.log('📤 [LOGIN]   - Se enviará:', fcmToken ? 'Sí' : 'No');
      
      console.log('📤 [LOGIN] Llamando a service.login()...');
      const response = await service.login(email, password, fcmToken || undefined, platform);
      console.log('📥 [LOGIN] service.login() retornó:', response.code);

      if (response.code === 200 && response.data) {
        const authData: AuthResponse = response.data;
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
    } else {
        throw new Error(response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setEnvironment('development');
    setApiUrl(API_URLS.development);
    setApiService(null);
    // Limpiar localStorage
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ENVIRONMENT);
    localStorage.removeItem(STORAGE_KEYS.API_URL);
    // Limpiar cookies si es necesario
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/backoffice/api/auth; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
