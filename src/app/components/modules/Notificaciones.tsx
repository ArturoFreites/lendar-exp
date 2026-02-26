import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNotificationUseCases } from '../../hooks/use-notifications';
import { useUsers } from '../../hooks/use-users';
import { useAuth } from '../../contexts/AuthContext';
import { useProdPromotion } from '../../contexts/ProdPromotionContext';
import {
  NotificationResponse,
  NotificationConfigResponse,
  NotificationConfigRequest,
  UserProfileResponse,
} from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { TablePagination } from '../ui/table-pagination';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
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
  Shield,
  ArrowLeft,
  Save,
  Eye,
  BookOpen,
  Upload,
} from 'lucide-react';
import { EmailEditor } from './EmailEditor';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

const PLACEHOLDERS_HELP = 'Usa las variables entre llaves; ver leyenda abajo.';

/** Leyenda de variables para plantillas de notificación (título y mensaje). */
const NOTIFICATION_PLACEHOLDERS_LEGEND: { category: string; items: { key: string; desc: string }[] }[] = [
  { category: 'Tareas', items: [{ key: 'taskName', desc: 'Nombre de la tarea' }, { key: 'dueDate', desc: 'Fecha límite' }, { key: 'taskId', desc: 'ID de la tarea' }] },
  { category: 'Usuario', items: [{ key: 'fullName', desc: 'Nombre y apellido' }, { key: 'userName', desc: 'Nombre de usuario' }] },
  { category: 'Sistema', items: [{ key: 'year', desc: 'Año actual' }, { key: 'supportEmail', desc: 'Email de soporte' }] },
  { category: 'Otros', items: [{ key: 'solicitante', desc: 'Nombre del solicitante' }, { key: 'url', desc: 'URL generada' }, { key: 'orderId', desc: 'ID de orden' }] },
];

/** Reemplaza placeholders {{key}} o {key} en un texto con valores de ejemplo para la vista previa. */
function replacePlaceholdersForPreview(text: string): string {
  if (!text || typeof text !== 'string') return text;
  const samples: Record<string, string> = {
    taskName: 'Verificación KYC',
    dueDate: '15/03/2026',
    taskId: '12345',
    fullName: 'Usuario de ejemplo',
    userName: 'usuario.ejemplo',
    year: String(new Date().getFullYear()),
    supportEmail: 'soporte@lendar.com',
    solicitante: 'Juan Pérez',
    url: 'https://app.lendar.com/tarea/123',
    orderId: 'ORD-789',
  };
  return text
    .replace(/\{\{(\w+)\}\}/g, (_, key) => samples[key] ?? `[${key}]`)
    .replace(/\{(\w+)\}/g, (_, key) => samples[key] ?? `[${key}]`);
}

export function Notificaciones() {
  const { notifications: contextNotifications, refreshNotifications: refreshContextNotifications } = useNotifications();
  const notificationApi = useNotificationUseCases();
  const usersApi = useUsers();
  const { environment } = useAuth();
  const { openPromoteFlow } = useProdPromotion();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [notificationConfigs, setNotificationConfigs] = useState<NotificationConfigResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notificaciones');
  
  // Config management state
  const [configEditorFullScreen, setConfigEditorFullScreen] = useState<null | 'new' | number>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [showConfigPreview, setShowConfigPreview] = useState(true);
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
    if (!notificationApi.hasApi) {
      toast.error('No hay servicio de API disponible');
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const response = await notificationApi.getNotifications({ page: '0', size: '50' });
      if (response?.code === 200 && response.data) {
        setNotifications(response.data.content || []);
      } else {
        toast.error(response?.message || 'Error al cargar notificaciones');
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
    if (!notificationApi.hasApi) {
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
      if (search && search.trim()) {
        params.contains = `key:${search.trim()}`;
      }

      const response = await notificationApi.getNotificationConfigs(params);
      if (response?.code === 200 && response.data) {
        setNotificationConfigs(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
        setCurrentPage(response.data.number || 0);
      } else {
        toast.error(response?.message || 'Error al cargar configuraciones');
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
    if (!notificationApi.hasApi) return;

    try {
      const response = await notificationApi.markNotificationAsRead(id);
      if (response?.code === 200) {
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

  const openConfigEditorFullScreen = (config?: NotificationConfigResponse) => {
    if (config) {
      setEditingConfig(config);
      setConfigForm({
        key: config.key,
        titleTemplate: config.titleTemplate,
        messageTemplate: config.messageTemplate,
        deepLinkTemplate: config.deepLinkTemplate || '',
        metadataTemplate: config.metadataTemplate,
      });
      setConfigEditorFullScreen(config.id);
    } else {
      setEditingConfig(null);
      setConfigForm({
        key: '',
        titleTemplate: '',
        messageTemplate: '',
        deepLinkTemplate: '',
        metadataTemplate: null,
      });
      setConfigEditorFullScreen('new');
    }
  };

  const closeConfigEditorFullScreen = () => {
    setConfigEditorFullScreen(null);
    setEditingConfig(null);
  };

  const handleSaveConfig = async () => {
    if (!notificationApi.hasApi) return;

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

    setConfigSaving(true);
    try {
      const request: NotificationConfigRequest = {
        key: configForm.key.trim(),
        titleTemplate: configForm.titleTemplate.trim(),
        messageTemplate: configForm.messageTemplate.trim(),
        deepLinkTemplate: configForm.deepLinkTemplate?.trim() || null,
        metadataTemplate: configForm.metadataTemplate || null,
      };

      if (editingConfig) {
        const response = await notificationApi.updateNotificationConfig(editingConfig.id, request);
        if (response?.code === 200) {
          toast.success('Configuración actualizada correctamente');
          closeConfigEditorFullScreen();
          await loadNotificationConfigs(currentPage, configSearch);
        } else {
          toast.error(response?.message || 'Error al actualizar configuración');
        }
      } else {
        const response = await notificationApi.createNotificationConfig(request);
        if (response?.code === 200) {
          toast.success('Configuración creada correctamente');
          closeConfigEditorFullScreen();
          await loadNotificationConfigs(currentPage, configSearch);
        } else {
          toast.error(response?.message || 'Error al crear configuración');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar configuración');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleToggleActive = async (config: NotificationConfigResponse) => {
    if (!notificationApi.hasApi) return;

    try {
      const response = await notificationApi.updateNotificationConfigActive(config.id, !config.active);
      if (response?.code === 200) {
        toast.success(`Configuración ${!config.active ? 'activada' : 'desactivada'} correctamente`);
        await loadNotificationConfigs(currentPage, configSearch);
      } else {
        toast.error(response?.message || 'Error al actualizar estado');
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleUserSearch = async () => {
    if (!usersApi.hasApi) {
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
      const response = await usersApi.getUserProfile(userId);
      if (response?.code === 200 && response.data) {
        setUserProfile(response.data);
        toast.success('Usuario encontrado');
      } else {
        toast.error(response?.message || 'Usuario no encontrado');
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
    if (!notificationApi.hasApi) {
      return;
    }
    if (activeTab === 'notificaciones') {
      loadNotifications();
    } else if (activeTab === 'configuraciones') {
      loadNotificationConfigs(0, configSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, notificationApi.hasApi]);

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

  // Vista pantalla completa: editor de configuración + preview mockup móvil
  if (configEditorFullScreen !== null) {
    const previewTitle = replacePlaceholdersForPreview(configForm.titleTemplate);
    const previewMessage = configForm.messageTemplate || '<p class="text-[#6b6a6e] text-sm">Escribí el mensaje para ver la vista previa.</p>';

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#f8f9fa]">
        <header className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#4a494d]/10 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={closeConfigEditorFullScreen} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <span className="text-lg font-semibold text-[#3b3a3e]">
              {editingConfig ? `Editar: ${editingConfig.key}` : 'Nueva configuración'}
            </span>
          </div>
          <Button onClick={handleSaveConfig} disabled={configSaving} className="bg-[#55c3c5] hover:bg-[#4ab3b5] gap-2">
            <Save className="h-4 w-4" />
            {configSaving ? 'Guardando...' : editingConfig ? 'Actualizar' : 'Crear'}
          </Button>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={55} minSize={35} className="flex flex-col min-h-0 min-w-0 border-r border-[#4a494d]/10 bg-white">
            <ScrollArea className="flex-1 min-h-0">
              <div className="max-w-2xl space-y-5 p-6">
                <div className="space-y-2">
                  <Label className="text-[#3b3a3e]">Clave *</Label>
                  <Input
                    value={configForm.key}
                    onChange={(e) => setConfigForm((f) => ({ ...f, key: e.target.value }))}
                    placeholder="ej: task_assigned"
                    disabled={!!editingConfig}
                    className={editingConfig ? 'bg-[#f1f1f2] text-[#6b6a6e]' : ''}
                  />
                  {editingConfig && <p className="text-xs text-[#6b6a6e]">La clave no se puede modificar</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#3b3a3e]">Template del Título *</Label>
                  <Input
                    value={configForm.titleTemplate}
                    onChange={(e) => setConfigForm((f) => ({ ...f, titleTemplate: e.target.value }))}
                    placeholder="ej: Nueva tarea: {{taskName}}"
                  />
                  <p className="text-xs text-[#6b6a6e]">{PLACEHOLDERS_HELP}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#3b3a3e]">Template del Mensaje *</Label>
                  <EmailEditor
                    key={configEditorFullScreen === 'new' ? 'new' : configEditorFullScreen}
                    value={configForm.messageTemplate}
                    onChange={(html) => setConfigForm((f) => ({ ...f, messageTemplate: html }))}
                    placeholder="Mensaje de la notificación. Usa {{placeholders}}."
                    minHeight="220px"
                  />
                  <p className="text-xs text-[#6b6a6e]">{PLACEHOLDERS_HELP}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#3b3a3e]">Template del Deep Link (opcional)</Label>
                  <Input
                    value={configForm.deepLinkTemplate || ''}
                    onChange={(e) => setConfigForm((f) => ({ ...f, deepLinkTemplate: e.target.value }))}
                    placeholder="ej: lendar://task/{{taskId}}"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#3b3a3e]">Metadata Template (opcional, JSON)</Label>
                  <Textarea
                    value={configForm.metadataTemplate ? JSON.stringify(configForm.metadataTemplate, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                        setConfigForm((f) => ({ ...f, metadataTemplate: parsed }));
                      } catch {
                        // mantener valor si no es JSON válido
                      }
                    }}
                    placeholder='{"key": "value"}'
                    rows={3}
                  />
                </div>

                <Accordion type="single" collapsible className="rounded-xl border border-[#4a494d]/10 bg-[#f8f9fa] overflow-hidden">
                  <AccordionItem value="leyenda" className="border-none">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/50 [&[data-state=open]]:border-b [&[data-state=open]]:border-[#4a494d]/10">
                      <span className="text-sm font-semibold text-[#3b3a3e] flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#55c3c5]" />
                        Leyenda de variables
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-4 pb-4 space-y-5">
                        <p className="text-xs text-[#6b6a6e]">Usá doble llave, ej. {`{{taskName}}`}</p>
                        {NOTIFICATION_PLACEHOLDERS_LEGEND.map(({ category, items }) => (
                          <div key={category}>
                            <p className="text-xs font-semibold text-[#55c3c5] uppercase tracking-wide mb-2">{category}</p>
                            <ul className="space-y-2">
                              {items.map(({ key, desc }) => (
                                <li key={key} className="flex items-start gap-3 text-sm">
                                  <code className="rounded-md bg-[#e8eaeb] px-2 py-1 font-mono text-xs shrink-0 border border-[#4a494d]/10">{`{{${key}}}`}</code>
                                  <span className="text-[#6b6a6e] pt-0.5">{desc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-[#4a494d]/10 hover:bg-[#55c3c5]/30 transition-colors" />
          <ResizablePanel defaultSize={45} minSize={25} className="flex flex-col min-w-0 bg-[#eef0f1]">
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#4a494d]/10 bg-white/80">
              <span className="text-sm font-medium text-[#6b6a6e] flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vista previa (notificación móvil)
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowConfigPreview((v) => !v)}>
                {showConfigPreview ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
            {showConfigPreview && (
              <div className="flex-1 p-6 flex justify-center min-h-0">
                <div className="w-[320px] rounded-[2.5rem] border-[10px] border-[#1f2a2a] bg-[#1f2a2a] shadow-2xl overflow-hidden flex flex-col max-h-full" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <div className="h-[44px] bg-[#1f2a2a] flex items-center justify-center shrink-0">
                    <div className="w-24 h-1.5 rounded-full bg-[#4a494d]" />
                  </div>
                  <div className="bg-[#f8f9fa] p-4 flex-1 min-h-0 flex flex-col">
                    <div className="rounded-xl bg-white border border-[#4a494d]/10 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                      <div className="p-3 border-b border-[#4a494d]/10 flex items-center gap-2 shrink-0">
                        <Bell className="h-5 w-5 text-[#55c3c5] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1f2a2a] text-sm truncate">{previewTitle || 'Título'}</p>
                          <p className="text-xs text-[#6b6a6e]">Ahora</p>
                        </div>
                      </div>
                      <div className="p-3 text-sm text-[#3b3a3e] prose prose-sm max-w-none overflow-y-auto [&_a]:text-[#55c3c5] [&_a.email-cta-button]:bg-[#55c3c5] [&_a.email-cta-button]:text-white [&_a.email-cta-button]:px-3 [&_a.email-cta-button]:py-1.5 [&_a.email-cta-button]:rounded [&_a.email-cta-button]:no-underline" dangerouslySetInnerHTML={{ __html: previewMessage }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

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
                <Button onClick={() => openConfigEditorFullScreen()} className="gap-2">
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
                                  onClick={() => openConfigEditorFullScreen(config)}
                                  className="gap-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Editar
                                </Button>
                                {environment === 'development' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openPromoteFlow('notification_config', {
                                        key: config.key,
                                        titleTemplate: config.titleTemplate,
                                        messageTemplate: config.messageTemplate,
                                        deepLinkTemplate: config.deepLinkTemplate ?? null,
                                        metadataTemplate: config.metadataTemplate ?? null,
                                      })
                                    }
                                    className="gap-2"
                                    title="Subir esta configuración a producción"
                                  >
                                    <Upload className="h-4 w-4" />
                                    Subir a producción
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {totalPages > 1 && (
                    <div className="mt-4 pt-4 border-t">
                      <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(p) => loadNotificationConfigs(p, configSearch)}
                        disabled={configLoading}
                      />
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

    </div>
  );
}
