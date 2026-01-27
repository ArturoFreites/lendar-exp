import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  NotificationResponse, 
  NotificationConfigResponse,
  NotificationConfigRequest,
  PaginationResponse,
  UserProfileResponse
} from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { 
  Bell, 
  Check, 
  RefreshCw, 
  Plus, 
  Edit2, 
  Search,
  Settings,
  Power,
  PowerOff,
  UserSearch,
  User,
  Mail,
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

export function Notificaciones() {
  const { apiService } = useAuth();
  const { notifications: contextNotifications, refreshNotifications: refreshContextNotifications } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [notificationConfigs, setNotificationConfigs] = useState<NotificationConfigResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notificaciones');
  
  // Config management state
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NotificationConfigResponse | null>(null);
  const [configForm, setConfigForm] = useState<NotificationConfigRequest>({
    key: '',
    titleTemplate: '',
    messageTemplate: '',
    deepLinkTemplate: '',
    metadataTemplate: null,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Config search state
  const [configSearch, setConfigSearch] = useState('');
  const configSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User search state
  const [userIdSearch, setUserIdSearch] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  const loadNotifications = async () => {
    if (!apiService) {
      toast.error('No hay servicio de API disponible');
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getNotifications({ page: '0', size: '50' });
      if (response.code === 200 && response.data) {
        setNotifications(response.data.content || []);
      } else {
        toast.error(response.message || 'Error al cargar notificaciones');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar notificaciones');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationConfigs = async (page: number = 0, search?: string) => {
    if (!apiService) {
      toast.error('No hay servicio de API disponible');
      setNotificationConfigs([]);
      return;
    }

    setConfigLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        size: '10',
      };
      // Backend BaseRepository espera operador "contains" con "field:value" para LIKE %value%
      if (search && search.trim()) {
        params.contains = `key:${search.trim()}`;
      }

      const response = await apiService.getNotificationConfigs(params);
      if (response.code === 200 && response.data) {
        setNotificationConfigs(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
        setCurrentPage(response.data.number || 0);
      } else {
        toast.error(response.message || 'Error al cargar configuraciones');
        setNotificationConfigs([]);
      }
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar configuraciones');
      setNotificationConfigs([]);
    } finally {
      setConfigLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    if (!apiService) return;

    try {
      const response = await apiService.markNotificationAsRead(id);
      if (response.code === 200) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString(), status: 'READ' } : n)
        );
        toast.success('Notificación marcada como leída');
      }
    } catch (error) {
      toast.error('Error al marcar como leída');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'notificaciones') {
      await loadNotifications();
      await refreshContextNotifications(); // Sincronizar con el contexto
    } else if (activeTab === 'configuraciones') {
      await loadNotificationConfigs(0, configSearch);
    } else if (activeTab === 'buscador' && userIdSearch) {
      await handleUserSearch();
    }
    setRefreshing(false);
  };

  const runConfigSearch = (searchValue: string) => {
    setCurrentPage(0);
    loadNotificationConfigs(0, searchValue);
  };

  const handleConfigSearch = (searchValue: string) => {
    setConfigSearch(searchValue);
    if (configSearchDebounceRef.current) {
      clearTimeout(configSearchDebounceRef.current);
      configSearchDebounceRef.current = null;
    }
    configSearchDebounceRef.current = setTimeout(() => {
      configSearchDebounceRef.current = null;
      runConfigSearch(searchValue);
    }, 300);
  };

  const handleConfigSearchSubmit = () => {
    if (configSearchDebounceRef.current) {
      clearTimeout(configSearchDebounceRef.current);
      configSearchDebounceRef.current = null;
    }
    runConfigSearch(configSearch);
  };

  // Sincronizar notificaciones del contexto cuando cambian
  useEffect(() => {
    if (activeTab === 'notificaciones' && contextNotifications.length > 0) {
      setNotifications(contextNotifications);
    }
  }, [contextNotifications, activeTab]);

  const handleOpenConfigDialog = (config?: NotificationConfigResponse) => {
    if (config) {
      setEditingConfig(config);
      setConfigForm({
        key: config.key,
        titleTemplate: config.titleTemplate,
        messageTemplate: config.messageTemplate,
        deepLinkTemplate: config.deepLinkTemplate || '',
        metadataTemplate: config.metadataTemplate,
      });
    } else {
      setEditingConfig(null);
      setConfigForm({
        key: '',
        titleTemplate: '',
        messageTemplate: '',
        deepLinkTemplate: '',
        metadataTemplate: null,
      });
    }
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!apiService) return;

    // Validación básica
    if (!configForm.key.trim()) {
      toast.error('La clave es obligatoria');
      return;
    }
    if (!configForm.titleTemplate.trim()) {
      toast.error('El template del título es obligatorio');
      return;
    }
    if (!configForm.messageTemplate.trim()) {
      toast.error('El template del mensaje es obligatorio');
      return;
    }

    try {
      const request: NotificationConfigRequest = {
        key: configForm.key.trim(),
        titleTemplate: configForm.titleTemplate.trim(),
        messageTemplate: configForm.messageTemplate.trim(),
        deepLinkTemplate: configForm.deepLinkTemplate?.trim() || null,
        metadataTemplate: configForm.metadataTemplate || null,
      };

      if (editingConfig) {
        const response = await apiService.updateNotificationConfig(editingConfig.id, request);
        if (response.code === 200) {
          toast.success('Configuración actualizada correctamente');
          setIsConfigDialogOpen(false);
          await loadNotificationConfigs(currentPage, configSearch);
        } else {
          toast.error(response.message || 'Error al actualizar configuración');
        }
      } else {
        const response = await apiService.createNotificationConfig(request);
        if (response.code === 200) {
          toast.success('Configuración creada correctamente');
          setIsConfigDialogOpen(false);
          await loadNotificationConfigs(currentPage, configSearch);
        } else {
          toast.error(response.message || 'Error al crear configuración');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar configuración');
    }
  };

  const handleToggleActive = async (config: NotificationConfigResponse) => {
    if (!apiService) return;

    try {
      const response = await apiService.updateNotificationConfigActive(config.id, !config.active);
      if (response.code === 200) {
        toast.success(`Configuración ${!config.active ? 'activada' : 'desactivada'} correctamente`);
        await loadNotificationConfigs(currentPage, configSearch);
      } else {
        toast.error(response.message || 'Error al actualizar estado');
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleUserSearch = async () => {
    if (!apiService) {
      toast.error('No hay servicio de API disponible');
      return;
    }

    const userId = parseInt(userIdSearch.trim());
    if (isNaN(userId) || userId <= 0) {
      toast.error('Por favor ingresa un ID de usuario válido');
      return;
    }

    setUserSearchLoading(true);
    setUserProfile(null);
    try {
      const response = await apiService.getUserProfile(userId);
      if (response.code === 200 && response.data) {
        setUserProfile(response.data);
        toast.success('Usuario encontrado');
      } else {
        toast.error(response.message || 'Usuario no encontrado');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error al buscar usuario:', error);
      toast.error(error instanceof Error ? error.message : 'Error al buscar usuario');
      setUserProfile(null);
    } finally {
      setUserSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!apiService) {
      return;
    }
    if (activeTab === 'notificaciones') {
      loadNotifications();
    } else if (activeTab === 'configuraciones') {
      loadNotificationConfigs(0, configSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, apiService]);

  // Sincronizar notificaciones del contexto cuando cambian
  useEffect(() => {
    if (activeTab === 'notificaciones' && contextNotifications.length > 0) {
      setNotifications(contextNotifications);
    }
  }, [contextNotifications, activeTab]);

  useEffect(() => {
    return () => {
      if (configSearchDebounceRef.current) {
        clearTimeout(configSearchDebounceRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3b3a3e]">Notificaciones</h1>
          <p className="text-[#6b6a6e] mt-1">Gestiona tus notificaciones y configuraciones</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="notificaciones" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="configuraciones" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuraciones
          </TabsTrigger>
          <TabsTrigger value="buscador" className="gap-2">
            <UserSearch className="h-4 w-4" />
            Buscador de Usuarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notificaciones">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Lista de Notificaciones
              </CardTitle>
              <CardDescription>
                {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#55c3c5]/20 border-t-[#55c3c5] rounded-full animate-spin mb-3"></div>
                  <p className="text-[#6b6a6e]">Cargando notificaciones...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-[#9b9a9e] mb-3 opacity-50" />
                  <p className="text-[#6b6a6e]">No hay notificaciones</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {notifications.map((notification, index) => (
                      <Card
                        key={notification.id}
                        className={`border-l-4 transition-all duration-300 hover:shadow-md hover:scale-[1.01] animate-in slide-in-from-left ${
                          notification.readAt
                            ? 'border-l-gray-300 bg-gray-50'
                            : 'border-l-[#55c3c5] bg-white'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-[#3b3a3e]">{notification.title}</h3>
                                {!notification.readAt && (
                                  <Badge variant="default" className="bg-[#55c3c5]">
                                    Nuevo
                                  </Badge>
                                )}
                                <Badge variant="outline">{notification.type}</Badge>
                              </div>
                              <p className="text-[#6b6a6e] text-sm mb-2">{notification.message}</p>
                              <div className="flex items-center gap-4 text-xs text-[#6b6a6e]">
                                <span>
                                  {format(new Date(notification.createdAt), 'PPpp', { locale: es })}
                                </span>
                                {notification.sentPushAt && (
                                  <span className="text-green-600">✓ Push enviado</span>
                                )}
                              </div>
                            </div>
                            {!notification.readAt && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(notification.id)}
                                className="gap-2"
                              >
                                <Check className="h-4 w-4" />
                                Marcar leída
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuraciones">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuraciones de Notificaciones
                  </CardTitle>
                  <CardDescription>
                    {totalElements} configuración{totalElements !== 1 ? 'es' : ''} encontrada{totalElements !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenConfigDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Configuración
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6a6e]" />
                  <Input
                    type="text"
                    placeholder="Buscar por clave..."
                    value={configSearch}
                    onChange={(e) => handleConfigSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleConfigSearchSubmit())}
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConfigSearchSubmit}
                  disabled={configLoading}
                  className="gap-2 shrink-0"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>
              {configLoading ? (
                <div className="text-center py-8 text-[#6b6a6e]">Cargando configuraciones...</div>
              ) : notificationConfigs.length === 0 ? (
                <div className="text-center py-8 text-[#6b6a6e]">No hay configuraciones</div>
              ) : (
                <>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {notificationConfigs.map((config) => (
                        <Card
                          key={config.id}
                          className={`border-l-4 ${
                            config.active
                              ? 'border-l-[#55c3c5] bg-white'
                              : 'border-l-gray-300 bg-gray-50'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-[#3b3a3e]">{config.key}</h3>
                                  <Badge variant={config.active ? 'default' : 'outline'} className={config.active ? 'bg-[#55c3c5]' : ''}>
                                    {config.active ? 'Activa' : 'Inactiva'}
                                  </Badge>
                                </div>
                                <p className="text-[#6b6a6e] text-sm mb-1">
                                  <span className="font-medium">Título:</span> {config.titleTemplate}
                                </p>
                                <p className="text-[#6b6a6e] text-sm mb-2 line-clamp-2">
                                  <span className="font-medium">Mensaje:</span> {config.messageTemplate}
                                </p>
                                {config.deepLinkTemplate && (
                                  <p className="text-[#6b6a6e] text-xs mb-2">
                                    <span className="font-medium">Deep Link:</span> {config.deepLinkTemplate}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-[#6b6a6e]">
                                  <span>
                                    Creada: {format(new Date(config.createdAt), 'PPpp', { locale: es })}
                                  </span>
                                  {config.updatedAt && (
                                    <span>
                                      Actualizada: {format(new Date(config.updatedAt), 'PPpp', { locale: es })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleActive(config)}
                                  className="gap-2"
                                  title={config.active ? 'Desactivar' : 'Activar'}
                                >
                                  {config.active ? (
                                    <PowerOff className="h-4 w-4" />
                                  ) : (
                                    <Power className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenConfigDialog(config)}
                                  className="gap-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Editar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-[#6b6a6e]">
                        Página {currentPage + 1} de {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadNotificationConfigs(currentPage - 1, configSearch)}
                          disabled={currentPage === 0 || configLoading}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadNotificationConfigs(currentPage + 1, configSearch)}
                          disabled={currentPage >= totalPages - 1 || configLoading}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buscador">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserSearch className="h-5 w-5" />
                Buscar Usuario por ID
              </CardTitle>
              <CardDescription>
                Busca un usuario por su ID para ver su información y dispositivos vinculados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Ingresa el ID del usuario..."
                    value={userIdSearch}
                    onChange={(e) => setUserIdSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                    className="text-lg"
                  />
                </div>
                <Button 
                  onClick={handleUserSearch} 
                  disabled={userSearchLoading || !userIdSearch.trim()}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  {userSearchLoading ? 'Buscando...' : 'Buscar'}
                </Button>
                {userIdSearch && (
                  <Button 
                    onClick={() => { 
                      setUserIdSearch(''); 
                      setUserProfile(null); 
                    }} 
                    variant="outline"
                  >
                    Limpiar
                  </Button>
                )}
              </div>

              {userSearchLoading ? (
                <div className="text-center py-8 text-[#6b6a6e]">Buscando usuario...</div>
              ) : userProfile ? (
                <Card className="border-l-4 border-l-[#55c3c5]">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-[#55c3c5] rounded-lg">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-[#3b3a3e]">
                            {userProfile.name} {userProfile.lastName}
                          </h3>
                          <p className="text-sm text-[#6b6a6e]">ID: {userProfile.userId}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-[#6b6a6e] mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-[#6b6a6e]">Email</p>
                            <p className="text-[#3b3a3e]">{userProfile.email}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-[#6b6a6e] mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-[#6b6a6e]">Fecha de Creación</p>
                            <p className="text-[#3b3a3e]">
                              {format(new Date(userProfile.createdAt), 'PPpp', { locale: es })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-[#6b6a6e] mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-[#6b6a6e]">Roles</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {userProfile.roles.map((role, idx) => (
                                <Badge key={idx} variant="outline" className="bg-[#55c3c5]/10">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 flex items-center justify-center mt-0.5">
                            <div className={`h-3 w-3 rounded-full ${userProfile.enable ? 'bg-green-500' : 'bg-red-500'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#6b6a6e]">Estado</p>
                            <Badge variant={userProfile.enable ? 'default' : 'destructive'} className={userProfile.enable ? 'bg-green-500' : ''}>
                              {userProfile.enable ? 'Habilitado' : 'Deshabilitado'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-[#6b6a6e] mb-2">Confirmación de Email</p>
                        <Badge variant={userProfile.confirmEmail ? 'default' : 'outline'} className={userProfile.confirmEmail ? 'bg-green-500' : ''}>
                          {userProfile.confirmEmail ? 'Email Confirmado' : 'Email No Confirmado'}
                        </Badge>
                      </div>

                      {userProfile.client && (
                        <div className="pt-4 border-t">
                          <h4 className="text-lg font-semibold text-[#3b3a3e] mb-3">Información del Cliente</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-[#6b6a6e]">Nombre</p>
                              <p className="text-[#3b3a3e]">{userProfile.client.name} {userProfile.client.lastName}</p>
                            </div>
                            {userProfile.client.phone && (
                              <div>
                                <p className="text-sm font-medium text-[#6b6a6e]">Teléfono</p>
                                <p className="text-[#3b3a3e]">{userProfile.client.phone}</p>
                              </div>
                            )}
                            {userProfile.client.address && (
                              <div>
                                <p className="text-sm font-medium text-[#6b6a6e]">Dirección</p>
                                <p className="text-[#3b3a3e]">{userProfile.client.address}</p>
                              </div>
                            )}
                            {userProfile.client.city && (
                              <div>
                                <p className="text-sm font-medium text-[#6b6a6e]">Ciudad</p>
                                <p className="text-[#3b3a3e]">{userProfile.client.city}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-[#6b6a6e] mb-2">Dispositivos Vinculados</p>
                        <p className="text-[#6b6a6e] text-sm">
                          Nota: Para ver los dispositivos FCM vinculados, se requiere un endpoint específico en el backend.
                          Actualmente se muestra la información del perfil del usuario.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : userIdSearch && !userSearchLoading ? (
                <div className="text-center py-8 text-[#6b6a6e]">
                  Ingresa un ID de usuario y haz clic en "Buscar" para ver la información
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para crear/editar configuración */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Editar Configuración' : 'Nueva Configuración'}
            </DialogTitle>
            <DialogDescription>
              {editingConfig 
                ? 'Modifica los campos de la configuración de notificación'
                : 'Crea una nueva configuración de notificación'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key">Clave *</Label>
              <Input
                id="key"
                value={configForm.key}
                onChange={(e) => setConfigForm({ ...configForm, key: e.target.value })}
                placeholder="ej: task_assigned"
                disabled={!!editingConfig}
                className={editingConfig ? 'bg-gray-100' : ''}
              />
              {editingConfig && (
                <p className="text-xs text-[#6b6a6e]">La clave no se puede modificar</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="titleTemplate">Template del Título *</Label>
              <Input
                id="titleTemplate"
                value={configForm.titleTemplate}
                onChange={(e) => setConfigForm({ ...configForm, titleTemplate: e.target.value })}
                placeholder="ej: Nueva tarea asignada: {{taskName}}"
                maxLength={500}
              />
              <p className="text-xs text-[#6b6a6e]">
                {configForm.titleTemplate.length}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageTemplate">Template del Mensaje *</Label>
              <Textarea
                id="messageTemplate"
                value={configForm.messageTemplate}
                onChange={(e) => setConfigForm({ ...configForm, messageTemplate: e.target.value })}
                placeholder="ej: Se te ha asignado la tarea {{taskName}} con fecha límite {{dueDate}}"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deepLinkTemplate">Template del Deep Link (opcional)</Label>
              <Input
                id="deepLinkTemplate"
                value={configForm.deepLinkTemplate || ''}
                onChange={(e) => setConfigForm({ ...configForm, deepLinkTemplate: e.target.value })}
                placeholder="ej: lendar://task/{{taskId}}"
                maxLength={500}
              />
              <p className="text-xs text-[#6b6a6e]">
                {configForm.deepLinkTemplate?.length || 0}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadataTemplate">Metadata Template (opcional, JSON)</Label>
              <Textarea
                id="metadataTemplate"
                value={configForm.metadataTemplate ? JSON.stringify(configForm.metadataTemplate, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                    setConfigForm({ ...configForm, metadataTemplate: parsed });
                  } catch {
                    // Mantener el valor como string si no es JSON válido
                  }
                }}
                placeholder='{"key": "value"}'
                rows={4}
              />
              <p className="text-xs text-[#6b6a6e]">
                Ingresa un objeto JSON válido o déjalo vacío
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig} className="bg-[#55c3c5] hover:bg-[#4ab3b5]">
              {editingConfig ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
