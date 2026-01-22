import { useError } from '../contexts/ErrorContext';

/**
 * Helper para manejar errores de peticiones API
 * Captura errores y los muestra usando ErrorContext
 */
export function handleApiError(error: any, showError?: (error: any) => void) {
  console.error('❌ [API Error]:', error);

  // Si hay un showError disponible, usarlo
  if (showError) {
    const errorInfo = {
      title: 'Error en la petición',
      message: error?.message || 'Ha ocurrido un error al realizar la petición',
      code: error?.code,
      errors: error?.errors,
      details: error?.stack || (typeof error === 'object' ? JSON.stringify(error, null, 2) : undefined),
    };
    showError(errorInfo);
    return;
  }

  // Fallback: mostrar en consola
  console.error('Error no manejado:', error);
}

/**
 * Wrapper para funciones async que captura errores automáticamente
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  showError?: (error: any) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, showError);
    return null;
  }
}
