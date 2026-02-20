import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { ProdPromotionProvider } from './contexts/ProdPromotionContext';
import { ProdPromotionAdapter } from './adapters/prod-promotion.adapter';
import { Login } from './components/Login';
import { SoloAdministradores } from './components/SoloAdministradores';
import { Layout } from './components/Layout';
import { Dashboard } from './components/modules/Dashboard';
import { Ingresos } from './components/modules/Ingresos';
import { TareasLista } from './components/modules/TareasLista';
import { TareaDetalle } from './components/modules/TareaDetalle';
import { FormularioTaskConfig } from './components/modules/FormularioTaskConfig';
import { ConfigPrestamos } from './components/modules/ConfigPrestamos';
import { Notificaciones } from './components/modules/Notificaciones';
import { Emails } from './components/modules/Emails';
import { Usuarios } from './components/modules/Usuarios';
import { Escribanias } from './components/modules/Escribanias';
import { Regiones } from './components/modules/Regiones';
import { Franquicias } from './components/modules/Franquicias';
import { Utilidades } from './components/modules/Utilidades';
import { Migracion } from './components/modules/Migracion';
import { ProdCredentialsDialog } from './components/ProdCredentialsDialog';
import { PromoteConfirmDialog } from './components/PromoteConfirmDialog';
import { Toaster } from './components/ui/sonner';

const ROLE_ADMIN = 'ADMIN';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [selectedTareaId, setSelectedTareaId] = useState<string | null>(null);
  const [isCreatingTarea, setIsCreatingTarea] = useState(false);
  const [formularioTaskTypeId, setFormularioTaskTypeId] = useState<number | null>(null);
  const [formularioTaskTypeName, setFormularioTaskTypeName] = useState<string>('');

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

  const handleBackFromFormulario = () => {
    setFormularioTaskTypeId(null);
    setFormularioTaskTypeName('');
  };

  const renderModule = () => {
    // Si estamos en el módulo de tareas y hay una tarea seleccionada
    if (currentModule === 'tareas' && selectedTareaId) {
      return <TareaDetalle tareaId={selectedTareaId} onBack={handleBackToTareas} />;
    }

    // Si estamos en el módulo de tareas y se abrió el form maker para un tipo de tarea
    if (currentModule === 'tareas' && formularioTaskTypeId != null) {
      return (
        <FormularioTaskConfig
          taskTypeId={formularioTaskTypeId}
          taskTypeName={formularioTaskTypeName || `Tipo ${formularioTaskTypeId}`}
          onBack={handleBackFromFormulario}
        />
      );
    }

    switch (currentModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'ingresos':
        return <Ingresos />;
      case 'tareas':
        return (
          <TareasLista
            onSelectTarea={handleSelectTarea}
            onCreateTarea={handleCreateTarea}
            onOpenFormulario={(taskTypeId, taskTypeName) => {
              setFormularioTaskTypeId(taskTypeId);
              setFormularioTaskTypeName(taskTypeName);
            }}
          />
        );
      case 'prestamos':
        return <ConfigPrestamos />;
      case 'escribanias':
        return <Escribanias />;
      case 'regiones':
        return <Regiones />;
      case 'franquicias':
        return <Franquicias />;
      case 'notificaciones':
        return <Notificaciones />;
      case 'emails':
        return <Emails />;
      case 'usuarios':
        return <Usuarios />;
      case 'migracion':
        return <Migracion />;
      case 'utilidades':
        return <Utilidades />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={(module) => {
      setCurrentModule(module);
      setSelectedTareaId(null);
      setIsCreatingTarea(false);
      setFormularioTaskTypeId(null);
      setFormularioTaskTypeName('');
    }}>
      {renderModule()}
    </Layout>
  );
}

const prodBaseUrl = import.meta.env.VITE_API_URL_PROD || '';

export default function App() {
  const prodPromotionRepo = useMemo(() => new ProdPromotionAdapter(), []);

  return (
    <ErrorProvider>
      <AuthProvider>
        <NotificationProvider>
          <ProdPromotionProvider repo={prodPromotionRepo} prodBaseUrl={prodBaseUrl}>
            <AppContent />
            <ProdCredentialsDialog />
            <PromoteConfirmDialog />
            <Toaster
              position="top-center"
              toastOptions={{
                style: { maxWidth: 'min(90vw, 420px)', wordBreak: 'break-word' },
                classNames: { description: 'break-words line-clamp-4' },
              }}
            />
          </ProdPromotionProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}
