import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { ErrorDialog } from '../components/ErrorDialog';
import { registerGlobalErrorHandler, unregisterGlobalErrorHandler } from '../utils/globalErrorHandler';

interface ErrorInfo {
  title?: string;
  message: string;
  details?: string;
  code?: number;
  errors?: string[];
}

interface ErrorContextType {
  showError: (error: ErrorInfo | Error | string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showError = useCallback((errorInput: ErrorInfo | Error | string) => {
    let errorInfo: ErrorInfo;

    if (typeof errorInput === 'string') {
      errorInfo = { message: errorInput };
    } else if (errorInput instanceof Error) {
      errorInfo = {
        title: 'Error',
        message: errorInput.message,
        details: errorInput.stack,
      };
    } else {
      errorInfo = errorInput;
    }

    setError(errorInfo);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Limpiar el error después de un pequeño delay para permitir la animación
    setTimeout(() => setError(null), 200);
  }, []);

  // Registrar el handler global cuando el componente se monta
  useEffect(() => {
    registerGlobalErrorHandler(showError);
    return () => {
      unregisterGlobalErrorHandler();
    };
  }, [showError]);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <ErrorDialog
        isOpen={isOpen}
        onClose={handleClose}
        error={error}
      />
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Versión segura que retorna null si ErrorContext no está disponible
export function useErrorSafe(): ErrorContextType | null {
  try {
    const context = useContext(ErrorContext);
    return context || null;
  } catch {
    return null;
  }
}
