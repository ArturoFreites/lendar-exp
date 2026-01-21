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
  ): Promise<string> => {
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
        return null as any; // Nunca debería llegar aquí si required=true
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
      
      throw error;
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

      // 2. OBTENER TOKEN FCM (OBLIGATORIO) - El login no puede continuar sin él
      console.log('🔔 [FCM] Obteniendo token FCM (OBLIGATORIO antes de login)...');
      let fcmToken: string;
      
      try {
        // Timeout de 15 segundos, requerido (lanza error si no se obtiene)
        fcmToken = await getFCMTokenWithTimeout(15000, true);
        console.log('✅ [FCM] Token FCM obtenido exitosamente');
        console.log('✅ [FCM] Token listo para enviar en el login');
      } catch (error) {
        console.error('❌ [FCM] Error crítico: No se pudo obtener token FCM');
        console.error('❌ [FCM] El login no puede continuar sin el token FCM');
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'No se pudo obtener el token FCM. Verifica que las notificaciones estén habilitadas.';
        
        toast.error('Error: ' + errorMessage);
        throw new Error(errorMessage);
      }

      // 3. Detectar plataforma
      const platform = getPlatform();
      console.log('📱 [LOGIN] Plataforma detectada:', platform);

      // 4. Preparar request de login (con token FCM obligatorio)
      console.log('📤 [LOGIN] Preparando request de login...');
      console.log('📤 [LOGIN]   - Email:', email);
      console.log('📤 [LOGIN]   - Platform:', platform);
      console.log('📤 [LOGIN]   - FCM Token:', `${fcmToken.substring(0, 30)}... (${fcmToken.length} chars)`);
      console.log('📤 [LOGIN]   - Token FCM presente: ✅');
      
      // 5. Realizar login (con token FCM)
      console.log('📤 [LOGIN] Enviando request de login con token FCM...');
      const response = await service.login(email, password, fcmToken, platform);
      console.log('📥 [LOGIN] Respuesta recibida, código:', response.code);

      // 6. Procesar respuesta
      if (response.code === 200 && response.data) {
        const authData: AuthResponse = response.data;
        console.log('✅ [LOGIN] Login exitoso');
        console.log('✅ [LOGIN] Usuario:', authData.email);
        console.log('✅ [LOGIN] ID:', authData.id);
        console.log('✅ [LOGIN] Token FCM registrado en el backend');
        
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
        console.error('❌ [LOGIN] Error en respuesta:', response.message);
        throw new Error(response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('❌ [LOGIN] Error en proceso de login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      
      // Si el error es por FCM, mostrar mensaje más específico
      if (errorMessage.includes('FCM') || errorMessage.includes('token')) {
        toast.error('Error: No se pudo obtener el token de notificaciones. ' + 
                   'Por favor, habilita las notificaciones en tu navegador e intenta nuevamente.');
      } else {
        toast.error(errorMessage);
      }
      
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
