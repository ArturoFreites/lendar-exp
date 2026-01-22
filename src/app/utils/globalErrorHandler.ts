/**
 * Handler global para errores de API
 * Permite que ApiService dispare errores sin depender de React Context
 */

type ErrorHandler = (error: {
  title?: string;
  message: string;
  code?: number;
  errors?: string[];
  details?: string;
}) => void;

let globalErrorHandler: ErrorHandler | null = null;

/**
 * Registra un handler global de errores
 */
export function registerGlobalErrorHandler(handler: ErrorHandler) {
  globalErrorHandler = handler;
}

/**
 * Desregistra el handler global de errores
 */
export function unregisterGlobalErrorHandler() {
  globalErrorHandler = null;
}

/**
 * Dispara un error usando el handler global si está disponible
 */
export function triggerGlobalError(error: {
  title?: string;
  message: string;
  code?: number;
  errors?: string[];
  details?: string;
}) {
  if (globalErrorHandler) {
    globalErrorHandler(error);
  } else {
    // Fallback: log en consola
    console.error('❌ [Global Error Handler]:', error);
  }
}
