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
      return 'bg-blue-600';
    case 'SUCCESS':
      return 'bg-emerald-600';
    case 'WARNING':
      return 'bg-amber-500';
    case 'ERROR':
    case 'DANGER':
      return 'bg-red-600';
    default:
      return 'bg-[#0d9488]';
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
          className="relative h-9 w-9 rounded-lg hover:bg-[#4a494d]/15 transition-colors duration-200"
          aria-label="Notificaciones"
        >
          <Bell className={cn(
            "h-5 w-5 text-[#5a5960] transition-colors duration-200",
            unreadCount > 0 && "text-[#0d9488]"
          )} />
          {unreadCount > 0 && (
            <span
              key={unreadCount}
              className={cn(
                "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-md",
                "bg-[#0d9488] text-white text-[11px] font-semibold leading-none px-1",
                "ring-2 ring-white animate-badge-jump"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-[90vw] max-w-[440px] sm:w-[440px] p-0 bg-white border border-[#e5e4e8] shadow-[0_4px_24px_rgba(0,0,0,0.08)] rounded-xl overflow-hidden"
        sideOffset={8}
      >
        <div className="flex flex-col max-h-[85vh] sm:max-h-[650px] h-[85vh] sm:h-[650px]">
          {/* Header */}
          <div className="flex flex-col gap-3 p-4 border-b border-[#e5e4e8] bg-[#fafafa] flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d9488]/10">
                  <Bell className="h-4 w-4 text-[#0d9488] flex-shrink-0" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[15px] text-[#1c1b1f] truncate">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-[#5a5960]">
                      {unreadCount} sin leer
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "h-2 w-2 rounded-full cursor-help flex-shrink-0",
                      isConnected ? "bg-emerald-500" : "bg-amber-500"
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
                    className="h-8 px-2 text-xs text-[#5a5960] hover:text-[#1c1b1f] hover:bg-[#e5e4e8]/50"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Marcar todas</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshNotifications}
                  disabled={loading}
                  className="h-8 w-8 text-[#5a5960] hover:text-[#1c1b1f] hover:bg-[#e5e4e8]/50"
                  title="Actualizar"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#0d9488]" />
                  ) : (
                    <span className="text-base font-medium">↻</span>
                  )}
                </Button>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78767a]" />
              <Input
                placeholder="Buscar notificaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-white border-[#e5e4e8] text-[#1c1b1f] placeholder:text-[#78767a] focus:border-[#0d9488] focus-visible:ring-[#0d9488]/20"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-[#78767a] hover:text-[#1c1b1f]"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Filtros */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9 bg-[#eeeef0] p-0.5 rounded-lg">
                <TabsTrigger 
                  value="all" 
                  className="text-xs font-medium text-[#5a5960] data-[state=active]:bg-white data-[state=active]:text-[#1c1b1f] data-[state=active]:shadow-sm rounded-md px-3"
                >
                  Todas <span className="ml-1 opacity-70">({notifications.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="unread" 
                  className="text-xs font-medium text-[#5a5960] data-[state=active]:bg-white data-[state=active]:text-[#1c1b1f] data-[state=active]:shadow-sm rounded-md px-3"
                >
                  No leídas <span className="ml-1 opacity-70">({unreadNotifications.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="read" 
                  className="text-xs font-medium text-[#5a5960] data-[state=active]:bg-white data-[state=active]:text-[#1c1b1f] data-[state=active]:shadow-sm rounded-md px-3"
                >
                  Leídas <span className="ml-1 opacity-70">({notifications.length - unreadNotifications.length})</span>
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
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center mb-4",
                  searchQuery ? "bg-amber-50" : "bg-[#0d9488]/10"
                )}>
                  {searchQuery ? (
                    <Search className="h-7 w-7 text-amber-600" />
                  ) : (
                    <Bell className="h-7 w-7 text-[#0d9488]/60" />
                  )}
                </div>
                <p className="text-[15px] font-medium text-[#1c1b1f] mb-1">
                  {searchQuery ? 'No se encontraron resultados' : 'No hay notificaciones'}
                </p>
                <p className="text-sm text-[#5a5960] text-center max-w-[260px]">
                  {searchQuery 
                    ? 'Prueba con otras palabras' 
                    : 'Aquí aparecerán tus notificaciones cuando las recibas'}
                </p>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-sm text-[#0d9488] hover:bg-[#0d9488]/10"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-3">
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
                    <div key={groupName} className="mb-5">
                      <div className="flex items-center gap-2 px-1 py-2 mb-2">
                        <Calendar className="h-3.5 w-3.5 text-[#78767a] flex-shrink-0" />
                        <span className="text-xs font-semibold text-[#5a5960] uppercase tracking-wider">
                          {groupLabels[groupName]}
                        </span>
                        <span className="ml-auto text-xs text-[#78767a] tabular-nums">
                          {groupNotifications.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {groupNotifications.map((notification) => {
                          const isUnread = !notification.readAt;
                          const isMarking = markingAsRead === notification.id;
                          const Icon = getNotificationIcon(notification.type);
                          const iconColor = getNotificationColor(notification.type);

                          return (
                            <div
                              key={notification.id}
                              className={cn(
                                "group relative p-3 rounded-xl transition-colors duration-150 cursor-pointer border",
                                isUnread 
                                  ? "bg-[#f0fdfa] border-[#0d9488]/20 hover:bg-[#ecfdf8]" 
                                  : "bg-white border-[#e5e4e8] hover:bg-[#fafafa] hover:border-[#e0dfe3]"
                              )}
                              onClick={() => {
                                if (isUnread && !isMarking) {
                                  handleMarkAsRead(notification.id);
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                  iconColor,
                                  "text-white"
                                )}>
                                  <Icon className="h-4 w-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-0.5">
                                    <h4 className={cn(
                                      "font-semibold text-[14px] leading-snug break-words",
                                      isUnread ? "text-[#1c1b1f]" : "text-[#3d3c42]"
                                    )}>
                                      {notification.title}
                                    </h4>
                                    {isUnread && (
                                      <span className="h-2 w-2 rounded-full bg-[#0d9488] flex-shrink-0 mt-1.5" aria-hidden />
                                    )}
                                  </div>
                                  <p className="text-[13px] text-[#5a5960] mb-2 line-clamp-2 leading-relaxed break-words">
                                    {notification.message}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#78767a]">
                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                      {isToday(new Date(notification.createdAt))
                                        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })
                                        : format(new Date(notification.createdAt), 'PPp', { locale: es })}
                                    </span>
                                    <span className="text-[#9b9a9e]">·</span>
                                    <span className="font-medium text-[#5a5960]">{notification.type}</span>
                                  </div>
                                </div>

                                {isUnread && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[#0d9488] hover:bg-[#0d9488]/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                    disabled={isMarking}
                                    title="Marcar como leída"
                                  >
                                    {isMarking ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
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
            <div className="p-3 border-t border-[#e5e4e8] bg-[#fafafa] flex-shrink-0">
              <Button
                variant="ghost"
                className="w-full text-sm font-medium text-[#0d9488] hover:text-[#0f766e] hover:bg-[#0d9488]/10 rounded-lg h-10"
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
