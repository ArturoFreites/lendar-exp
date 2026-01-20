import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NotificationBell } from './NotificationBell';
import {
  LogOut,
  LayoutDashboard,
  TrendingUp,
  ListTodo,
  Settings,
  User,
  Bell,
} from 'lucide-react';
import logoImage from '../../assets/65d1f35782e19a4a8c4d56fc288c48d07bab3eaa.png';

interface LayoutProps {
  children: ReactNode;
  currentModule: string;
  onModuleChange: (module: string) => void;
}

export function Layout({ children, currentModule, onModuleChange }: LayoutProps) {
  const { user, environment, logout } = useAuth();

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'ingresos', name: 'Ingresos', icon: TrendingUp },
    { id: 'tareas', name: 'Tareas', icon: ListTodo },
    { id: 'prestamos', name: 'Variables', icon: Settings },
    { id: 'notificaciones', name: 'Notificaciones', icon: Bell },
    { id: 'usuarios', name: 'Usuarios', icon: User },
  ];

  return (
    <div className="flex h-screen bg-[#fefeff]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#3b3a3e] flex flex-col shadow-2xl shadow-black/10">
        <div className="p-8 border-b border-[#4a494d]/50">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 flex-shrink-0">
              <img src={logoImage} alt="QR Logo" className="w-full h-auto brightness-0 invert" />
            </div>
            <div>
              <h1 className="font-semibold text-xl text-[#fefeff] tracking-tight">CRM Lendar</h1>
              <p className="text-xs text-[#9b9a9e] mt-0.5">Sistema de Configuración</p>
            </div>
          </div>
          <Badge
            className={`${
              environment === 'production'
                ? 'bg-[#55c3c5] text-white shadow-lg shadow-[#55c3c5]/20'
                : 'bg-[#4a494d] text-[#fefeff]'
            } border-0 font-semibold px-4 py-1.5 rounded-lg text-xs tracking-wide`}
          >
            {environment === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}
          </Badge>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = currentModule === module.id;
            return (
              <button
                key={module.id}
                onClick={() => onModuleChange(module.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-[#55c3c5] text-white shadow-lg shadow-[#55c3c5]/20'
                    : 'text-[#9b9a9e] hover:text-[#fefeff] hover:bg-[#4a494d]/50'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#55c3c5] to-[#4ab3b5] opacity-90 animate-pulse" />
                )}
                <Icon className={`h-5 w-5 transition-all duration-300 relative z-10 ${isActive ? 'scale-110 rotate-3' : 'group-hover:scale-105 group-hover:rotate-1'}`} />
                <span className="font-medium text-sm relative z-10">{module.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#4a494d]/50">
          <div className="mb-4 px-4 py-4 bg-[#4a494d]/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#55c3c5] rounded-lg">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#fefeff] truncate">{user?.name || user?.email}</p>
                <p className="text-xs text-[#9b9a9e] capitalize mt-0.5">{user?.roles?.[0] || 'Usuario'}</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-[#4a494d] bg-transparent text-[#9b9a9e] hover:bg-[#4a494d]/50 hover:text-[#fefeff] hover:border-[#4a494d] transition-all rounded-xl h-11"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-[#fefeff] to-[#f8f9fa] relative">
        {/* Header con campanita de notificaciones */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#4a494d]/10 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>
        </div>
        <div className="relative animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}