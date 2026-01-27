import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Loader2, 
  Search, 
  X,
  Info,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Filter
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Skeleton } from './ui/skeleton';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from './ui/utils';

type FilterType = 'all' | 'unread' | 'read';

const getNotificationIcon = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'INFO':
    case 'INFORMATION':
      return Info;
    case 'SUCCESS':
      return CheckCircle2;
    case 'WARNING':
      return AlertTriangle;
    case 'ERROR':
    case 'DANGER':
      return AlertCircle;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'INFO':
    case 'INFORMATION':
      return 'bg-blue-500';
    case 'SUCCESS':
      return 'bg-green-500';
    case 'WARNING':
      return 'bg-yellow-500';
    case 'ERROR':
    case 'DANGER':
      return 'bg-red-500';
    default:
      return 'bg-[#55c3c5]';
  }
};

const groupNotificationsByDate = (notifications: any[]) => {
  const groups: Record<string, any[]> = {
    hoy: [],
    ayer: [],
    'esta semana': [],
    'este mes': [],
    'anteriores': [],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    
    if (isToday(date)) {
      groups.hoy.push(notification);
    } else if (isYesterday(date)) {
      groups.ayer.push(notification);
    } else if (isThisWeek(date)) {
      groups['esta semana'].push(notification);
    } else if (isThisMonth(date)) {
      groups['este mes'].push(notification);
    } else {
      groups.anteriores.push(notification);
    }
  });

  return groups;
};

export function NotificationBell() {
  const { notifications, unreadCount, loading, isConnected, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const handleMarkAsRead = async (id: number) => {
    setMarkingAsRead(id);
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  // Filtrar y buscar notificaciones
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Aplicar filtro de estado
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.readAt);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.readAt);
    }

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n => 
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          n.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, filter, searchQuery]);

  // Agrupar por fecha
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);

  const hasNotifications = filteredNotifications.length > 0;
  const unreadNotifications = notifications.filter(n => !n.readAt);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-[#4a494d]/50 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Bell className={cn(
            "h-5 w-5 text-[#9b9a9e] transition-all duration-300",
            unreadCount > 0 && "text-[#55c3c5] animate-pulse",
            "group-hover:text-[#fefeff]"
          )} />
          {unreadCount > 0 && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold",
                "bg-[#55c3c5] text-white border-2 border-white",
                "animate-bounce shadow-lg shadow-[#55c3c5]/50"
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-[90vw] max-w-[420px] sm:w-[420px] p-0 bg-white border-[#4a494d]/20 shadow-xl"
        sideOffset={8}
      >
        <div className="flex flex-col max-h-[85vh] sm:max-h-[650px] h-[85vh] sm:h-[650px]">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 border-b border-[#4a494d]/20 bg-gradient-to-r from-[#fefeff] to-[#f8f9fa] flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#55c3c5] flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base text-[#3b3a3e] truncate">Notificaciones</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-[#55c3c5] text-white text-[10px] sm:text-xs flex-shrink-0">
                    {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Indicador de estado de conexión */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "h-2 w-2 rounded-full transition-all cursor-help flex-shrink-0",
                      isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                    )} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {isConnected 
                        ? "Conectado en tiempo real" 
                        : "Modo sincronización periódica"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-xs text-[#6b6a6e] hover:text-[#3b3a3e]"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Todas</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshNotifications}
                  disabled={loading}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                  title="Actualizar"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-[#55c3c5]" />
                  ) : (
                    <span className="text-[#6b6a6e] hover:text-[#3b3a3e] text-sm sm:text-base">↻</span>
                  )}
                </Button>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#9b9a9e]" />
              <Input
                placeholder="Buscar notificaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-9 h-8 sm:h-9 text-xs sm:text-sm bg-white border-[#4a494d]/20 focus:border-[#55c3c5]"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filtros */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9 bg-[#f8f9fa]">
                <TabsTrigger value="all" className="text-[10px] sm:text-xs px-1 sm:px-3">
                  <span className="sm:hidden">Todas</span>
                  <span className="hidden sm:inline">Todas</span>
                  <span className="ml-1">({notifications.length})</span>
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-[10px] sm:text-xs px-1 sm:px-3">
                  <span className="sm:hidden">No</span>
                  <span className="hidden sm:inline">No leídas</span>
                  <span className="ml-1">({unreadNotifications.length})</span>
                </TabsTrigger>
                <TabsTrigger value="read" className="text-[10px] sm:text-xs px-1 sm:px-3">
                  <span className="sm:hidden">Sí</span>
                  <span className="hidden sm:inline">Leídas</span>
                  <span className="ml-1">({notifications.length - unreadNotifications.length})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: '100%' }}>
            {loading && notifications.length === 0 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasNotifications ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center mb-4",
                  searchQuery ? "bg-yellow-100" : "bg-[#55c3c5]/10"
                )}>
                  {searchQuery ? (
                    <Search className="h-8 w-8 text-yellow-600" />
                  ) : (
                    <Bell className="h-8 w-8 text-[#55c3c5] opacity-50" />
                  )}
                </div>
                <p className="text-sm font-medium text-[#3b3a3e] mb-1">
                  {searchQuery ? 'No se encontraron resultados' : 'No hay notificaciones'}
                </p>
                <p className="text-xs text-[#6b6a6e] text-center">
                  {searchQuery 
                    ? 'Intenta con otros términos de búsqueda' 
                    : 'Las notificaciones aparecerán aquí cuando las recibas'}
                </p>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-2 sm:p-3">
                {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => {
                  if (groupNotifications.length === 0) return null;

                  const groupLabels: Record<string, string> = {
                    hoy: 'Hoy',
                    ayer: 'Ayer',
                    'esta semana': 'Esta semana',
                    'este mes': 'Este mes',
                    anteriores: 'Anteriores',
                  };

                  return (
                    <div key={groupName} className="mb-4">
                      <div className="flex items-center gap-2 px-2 sm:px-3 py-2 mb-2">
                        <Calendar className="h-3.5 w-3.5 text-[#9b9a9e] flex-shrink-0" />
                        <span className="text-[10px] sm:text-xs font-semibold text-[#6b6a6e] uppercase tracking-wide">
                          {groupLabels[groupName]}
                        </span>
                        <Badge variant="outline" className="text-[10px] sm:text-xs h-5 px-1.5 ml-auto border-[#4a494d]/20">
                          {groupNotifications.length}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {groupNotifications.map((notification) => {
                          const isUnread = !notification.readAt;
                          const isMarking = markingAsRead === notification.id;
                          const Icon = getNotificationIcon(notification.type);
                          const iconColor = getNotificationColor(notification.type);

                          return (
                            <div
                              key={notification.id}
                              className={cn(
                                "group relative p-2 sm:p-3 rounded-lg transition-all duration-200 cursor-pointer",
                                "hover:bg-[#f8f9fa] hover:shadow-sm",
                                isUnread 
                                  ? "bg-[#55c3c5]/5 border-l-2 border-l-[#55c3c5]" 
                                  : "bg-white border-l-2 border-l-transparent"
                              )}
                              onClick={() => {
                                if (isUnread && !isMarking) {
                                  handleMarkAsRead(notification.id);
                                }
                              }}
                            >
                              <div className="flex items-start gap-2 sm:gap-3">
                                {/* Icono */}
                                <div className={cn(
                                  "h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                  iconColor,
                                  "text-white shadow-sm"
                                )}>
                                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </div>

                                {/* Contenido */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className={cn(
                                      "font-semibold text-xs sm:text-sm leading-tight break-words",
                                      isUnread ? "text-[#3b3a3e]" : "text-[#6b6a6e]"
                                    )}>
                                      {notification.title}
                                    </h4>
                                    {isUnread && (
                                      <div className="h-2 w-2 rounded-full bg-[#55c3c5] flex-shrink-0 mt-1.5 animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-[#6b6a6e] mb-2 line-clamp-2 leading-relaxed break-words">
                                    {notification.message}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[#9b9a9e]">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      <span className="whitespace-nowrap">
                                        {isToday(new Date(notification.createdAt))
                                          ? formatDistanceToNow(new Date(notification.createdAt), { 
                                              addSuffix: true, 
                                              locale: es 
                                            })
                                          : format(new Date(notification.createdAt), 'PPp', { locale: es })
                                        }
                                      </span>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className="text-[10px] sm:text-xs border-[#4a494d]/20 px-1.5 py-0"
                                    >
                                      {notification.type}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Botón de acción */}
                                {isUnread && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                                      "hover:bg-[#55c3c5]/10"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                    disabled={isMarking}
                                    title="Marcar como leída"
                                  >
                                    {isMarking ? (
                                      <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-[#55c3c5]" />
                                    ) : (
                                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#55c3c5]" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {hasNotifications && (
            <div className="p-2 sm:p-3 border-t border-[#4a494d]/20 bg-[#f8f9fa] flex-shrink-0">
              <Button
                variant="ghost"
                className="w-full text-xs sm:text-sm text-[#55c3c5] hover:text-[#4ab3b5] hover:bg-[#55c3c5]/10"
                onClick={() => {
                  setOpen(false);
                  window.location.hash = '#notificaciones';
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
