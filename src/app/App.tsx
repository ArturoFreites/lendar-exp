import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { Login } from './components/Login';
import { SoloAdministradores } from './components/SoloAdministradores';
import { Layout } from './components/Layout';
import { Dashboard } from './components/modules/Dashboard';
import { Ingresos } from './components/modules/Ingresos';
import { TareasLista } from './components/modules/TareasLista';
import { TareaDetalle } from './components/modules/TareaDetalle';
import { ConfigPrestamos } from './components/modules/ConfigPrestamos';
import { Notificaciones } from './components/modules/Notificaciones';
import { Emails } from './components/modules/Emails';
import { Usuarios } from './components/modules/Usuarios';
import { Toaster } from './components/ui/sonner';

const ROLE_ADMIN = 'ADMIN';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [selectedTareaId, setSelectedTareaId] = useState<string | null>(null);
  const [isCreatingTarea, setIsCreatingTarea] = useState(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  const isAdmin = user?.roles?.some((r) => String(r).toUpperCase() === ROLE_ADMIN) ?? false;
  if (!isAdmin) {
    return <SoloAdministradores />;
  }

  const handleSelectTarea = (tareaId: string) => {
    setSelectedTareaId(tareaId);
  };

  const handleBackToTareas = () => {
    setSelectedTareaId(null);
    setIsCreatingTarea(false);
  };

  const handleCreateTarea = () => {
    setIsCreatingTarea(true);
    setSelectedTareaId('new');
  };

  const renderModule = () => {
    // Si estamos en el módulo de tareas y hay una tarea seleccionada
    if (currentModule === 'tareas' && selectedTareaId) {
      return <TareaDetalle tareaId={selectedTareaId} onBack={handleBackToTareas} />;
    }

    switch (currentModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'ingresos':
        return <Ingresos />;
      case 'tareas':
        return <TareasLista onSelectTarea={handleSelectTarea} onCreateTarea={handleCreateTarea} />;
      case 'prestamos':
        return <ConfigPrestamos />;
      case 'notificaciones':
        return <Notificaciones />;
      case 'emails':
        return <Emails />;
      case 'usuarios':
        return <Usuarios />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={(module) => {
      setCurrentModule(module);
      setSelectedTareaId(null);
      setIsCreatingTarea(false);
    }}>
      {renderModule()}
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
          <Toaster
            position="top-center"
            toastOptions={{
              style: { maxWidth: 'min(90vw, 420px)', wordBreak: 'break-word' },
              classNames: { description: 'break-words line-clamp-4' },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}
