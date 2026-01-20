import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserResponse,
  RoleResponse,
  PermissionResponse,
  PaginationResponse,
  UserProfileResponse,
  RoleRequest,
  UserRoleUpdaterRequest,
  PermissionRequest,
  UserSessionResponse
} from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { 
  Users, 
  RefreshCw, 
  Search,
  Shield,
  Key,
  Monitor,
  Plus,
  Edit2,
  User as UserIcon,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

export function Usuarios() {
  const { apiService } = useAuth();
  const [activeTab, setActiveTab] = useState('sesiones');
  
  // Sesiones state
  const [sessions, setSessions] = useState<UserSessionResponse[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionUserEmail, setSessionUserEmail] = useState('');
  const [revokingAll, setRevokingAll] = useState(false);
  
  // Usuarios state
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersCurrentPage, setUsersCurrentPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotalElements, setUsersTotalElements] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  
  // Roles state
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesCurrentPage, setRolesCurrentPage] = useState(0);
  const [rolesTotalPages, setRolesTotalPages] = useState(0);
  const [rolesTotalElements, setRolesTotalElements] = useState(0);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [roleForm, setRoleForm] = useState<RoleRequest>({
    name: '',
    permissionIds: [],
  });
  const [availablePermissions, setAvailablePermissions] = useState<PermissionResponse[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  
  // Permissions state
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsCurrentPage, setPermissionsCurrentPage] = useState(0);
  const [permissionsTotalPages, setPermissionsTotalPages] = useState(0);
  const [permissionsTotalElements, setPermissionsTotalElements] = useState(0);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionResponse | null>(null);
  const [permissionForm, setPermissionForm] = useState<PermissionRequest>({
    name: '',
    description: '',
  });
  
  // User-Role assignment state
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const loadSessions = async () => {
    if (!apiService) {
      toast.error('No hay servicio de API disponible');
      return;
    }

    setSessionsLoading(true);
    try {
      const email = sessionUserEmail.trim() || undefined;
      const response = await apiService.getUserSessions(email);
      
      if (response.code === 200 && response.data) {
        setSessions(response.data);
        if (response.data.length === 0) {
          toast.info(email 
            ? `No se encontraron sesiones para el usuario ${email}`
            : 'No tienes sesiones activas');
        }
      } else {
        toast.error(response.message || 'Error al cargar sesiones');
        setSessions([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar sesiones');
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!apiService) {
      toast.error('No hay servicio de API disponible');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas cerrar todas tus sesiones? Esto te deslogueará de todos los dispositivos.')) {
      return;
    }

    setRevokingAll(true);
    try {
      const response = await apiService.revokeAllSessions();
      
      if (response.code === 200) {
        toast.success('Todas las sesiones han sido cerradas correctamente');
        setSessions([]);
        // Opcional: redirigir al login o recargar la página
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        toast.error(response.message || 'Error al cerrar sesiones');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cerrar sesiones');
    } finally {
      setRevokingAll(false);
    }
  };

  const loadUsers = async (page: number = 0, search?: string) => {
    if (!apiService) {
      toast.error('No hay servicio de API disponible');
      setUsers([]);
      return;
    }

    setUsersLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        size: '10',
      };
      
      if (search && search.trim()) {
        // Usar el operador 'contains' para búsqueda "contiene" en lugar de igualdad exacta
        // El formato es: contains=email:valor
        params.contains = `email:${search.trim()}`;
      }

      const response = await apiService.getUsers(params);
      if (response.code === 200 && response.data) {
        const usersList = response.data.content || [];
        setUsers(usersList);
        setUsersTotalPages(response.data.totalPages || 0);
        setUsersTotalElements(response.data.totalElements || 0);
        setUsersCurrentPage(response.data.number || 0);
        
        if (usersList.length === 0 && search) {
          toast.info('No se encontraron usuarios con ese criterio de búsqueda');
        }
      } else {
        toast.error(response.message || 'Error al cargar usuarios');
        setUsers([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar usuarios');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadRoles = async (page: number = 0) => {
    if (!apiService) {
      setRoles([]);
      return;
    }

    setRolesLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        size: '10',
      };

      const response = await apiService.getRoles(params);
      if (response.code === 200 && response.data) {
        const rolesList = response.data.content || [];
        setRoles(rolesList);
        setRolesTotalPages(response.data.totalPages || 0);
        setRolesTotalElements(response.data.totalElements || 0);
        setRolesCurrentPage(response.data.number || 0);
      } else {
        toast.error(response.message || 'Error al cargar roles');
        setRoles([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar roles');
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  const loadPermissions = async (page: number = 0) => {
    if (!apiService) {
      setPermissions([]);
      return;
    }

    setPermissionsLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        size: '100', // Cargar más permisos ya que suelen ser pocos
      };

      const response = await apiService.getPermissions(params);
      if (response.code === 200 && response.data) {
        const permissionsList = response.data.content || [];
        setPermissions(permissionsList);
        setPermissionsTotalPages(response.data.totalPages || 0);
        setPermissionsTotalElements(response.data.totalElements || 0);
        setPermissionsCurrentPage(response.data.number || 0);
      } else {
        toast.error(response.message || 'Error al cargar permisos');
        setPermissions([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar permisos');
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const loadRole = async (roleId: number) => {
    if (!apiService) return null;
    try {
      const response = await apiService.getRoleById(roleId);
      if (response.code === 200 && response.data) {
        return response.data;
      }
    } catch (error) {
      // Error silencioso al cargar rol
    }
    return null;
  };

  const handleUserSearch = () => {
    setUsersCurrentPage(0);
    loadUsers(0, userSearch);
  };

  const handleOpenRoleDialog = async (role?: RoleResponse) => {
    // Cargar permisos disponibles si no están cargados
    if (availablePermissions.length === 0) {
      if (!apiService) return;
      try {
        const response = await apiService.getPermissions({ page: '0', size: '100' });
        if (response.code === 200 && response.data) {
          setAvailablePermissions(response.data.content || []);
        }
      } catch (error) {
        toast.error('Error al cargar permisos disponibles');
      }
    }

    if (role) {
      setEditingRole(role);
      // Cargar los permisos del rol
      const roleData = await loadRole(role.id);
      setRoleForm({
        name: role.name,
        permissionIds: roleData?.permissions?.map(p => p.id) || [],
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: '',
        permissionIds: [],
      });
    }
    setIsRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!apiService) return;

    if (!roleForm.name.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }

    try {
      if (editingRole) {
        const response = await apiService.updateRole(editingRole.id, roleForm);
        if (response.code === 200) {
          toast.success('Rol actualizado correctamente');
          setIsRoleDialogOpen(false);
          await loadRoles(rolesCurrentPage);
        } else {
          toast.error(response.message || 'Error al actualizar rol');
        }
      } else {
        const response = await apiService.createRole(roleForm);
        if (response.code === 200) {
          toast.success('Rol creado correctamente');
          setIsRoleDialogOpen(false);
          await loadRoles(0);
        } else {
          toast.error(response.message || 'Error al crear rol');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar rol');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!apiService) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar este rol?')) {
      return;
    }

    try {
      const response = await apiService.deleteRole(roleId);
      if (response.code === 200) {
        toast.success('Rol eliminado correctamente');
        await loadRoles(rolesCurrentPage);
      } else {
        toast.error(response.message || 'Error al eliminar rol');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar rol');
    }
  };

  const handleOpenUserRoleDialog = async (user: UserResponse) => {
    // Cargar roles disponibles si no están cargados
    if (roles.length === 0) {
      await loadRoles(0);
    }
    
    setSelectedUser(user);
    setSelectedRoleId(user.roles[0]?.id || null);
    setIsUserRoleDialogOpen(true);
  };

  const handleSaveUserRole = async () => {
    if (!apiService || !selectedUser) return;

    if (!selectedRoleId) {
      toast.error('Debes seleccionar un rol');
      return;
    }

    const selectedRole = roles.find(r => r.id === selectedRoleId);
    if (!selectedRole) {
      toast.error('Rol no encontrado');
      return;
    }

    try {
      const request: UserRoleUpdaterRequest = {
        userId: selectedUser.id,
        type: selectedRole.name,
      };

      const response = await apiService.updateUserRole(request);
      if (response.code === 200) {
        toast.success('Rol asignado correctamente');
        setIsUserRoleDialogOpen(false);
        await loadUsers(usersCurrentPage, userSearch);
      } else {
        toast.error(response.message || 'Error al asignar rol');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al asignar rol');
    }
  };

  const handleOpenPermissionDialog = (permission?: PermissionResponse) => {
    if (permission) {
      setEditingPermission(permission);
      setPermissionForm({
        name: permission.name,
        description: permission.description || '',
      });
    } else {
      setEditingPermission(null);
      setPermissionForm({
        name: '',
        description: '',
      });
    }
    setIsPermissionDialogOpen(true);
  };

  const handleSavePermission = async () => {
    if (!apiService) return;

    if (!permissionForm.name.trim()) {
      toast.error('El nombre del permiso es obligatorio');
      return;
    }

    try {
      if (editingPermission) {
        const response = await apiService.updatePermission(editingPermission.id, permissionForm);
        if (response.code === 200) {
          toast.success('Permiso actualizado correctamente');
          setIsPermissionDialogOpen(false);
          await loadPermissions(permissionsCurrentPage);
        } else {
          toast.error(response.message || 'Error al actualizar permiso');
        }
      } else {
        const response = await apiService.createPermission(permissionForm);
        if (response.code === 200) {
          toast.success('Permiso creado correctamente');
          setIsPermissionDialogOpen(false);
          await loadPermissions(0);
        } else {
          toast.error(response.message || 'Error al crear permiso');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar permiso');
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (!apiService) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar este permiso?')) {
      return;
    }

    try {
      const response = await apiService.deletePermission(permissionId);
      if (response.code === 200) {
        toast.success('Permiso eliminado correctamente');
        await loadPermissions(permissionsCurrentPage);
      } else {
        toast.error(response.message || 'Error al eliminar permiso');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar permiso');
    }
  };

  const renderPermissionsSelector = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Permisos</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const filtered = availablePermissions.filter(p => 
                  p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                  p.description?.toLowerCase().includes(permissionSearch.toLowerCase())
                );
                const allFilteredIds = filtered.map(p => p.id);
                const allSelected = allFilteredIds.every(id => roleForm.permissionIds.includes(id));
                
                if (allSelected) {
                  setRoleForm({
                    ...roleForm,
                    permissionIds: roleForm.permissionIds.filter(id => !allFilteredIds.includes(id)),
                  });
                } else {
                  setRoleForm({
                    ...roleForm,
                    permissionIds: [...new Set([...roleForm.permissionIds, ...allFilteredIds])],
                  });
                }
              }}
              className="text-xs h-7"
            >
              {availablePermissions.filter(p => 
                p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                p.description?.toLowerCase().includes(permissionSearch.toLowerCase())
              ).every(p => roleForm.permissionIds.includes(p.id)) ? (
                <>
                  <Square className="h-3 w-3 mr-1" />
                  Deseleccionar filtrados
                </>
              ) : (
                <>
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Seleccionar filtrados
                </>
              )}
            </Button>
            <div className="text-xs text-[#6b6a6e] flex items-center">
              {roleForm.permissionIds.length} seleccionado{roleForm.permissionIds.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b6a6e] pointer-events-none" />
          <Input
            placeholder="Buscar permisos por nombre o descripción..."
            value={permissionSearch}
            onChange={(e) => setPermissionSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[400px] border rounded-md">
          {availablePermissions.length === 0 ? (
            <div className="text-sm text-[#6b6a6e] text-center py-8">
              Cargando permisos...
            </div>
          ) : (
            <div className="p-4">
              {availablePermissions
                .filter(permission => 
                  permission.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                  permission.description?.toLowerCase().includes(permissionSearch.toLowerCase())
                )
                .length === 0 ? (
                  <div className="text-sm text-[#6b6a6e] text-center py-8">
                    No se encontraron permisos con ese criterio de búsqueda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availablePermissions
                      .filter(permission => 
                        permission.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                        permission.description?.toLowerCase().includes(permissionSearch.toLowerCase())
                      )
                      .map((permission) => {
                        const isSelected = roleForm.permissionIds.includes(permission.id);
                        return (
                          <Tooltip key={permission.id} delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div
                                className={`
                                  flex items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all w-full
                                  ${isSelected 
                                    ? 'border-[#55c3c5] bg-[#55c3c5]/10 hover:bg-[#55c3c5]/15' 
                                    : 'border-gray-200 hover:border-[#55c3c5]/50 hover:bg-gray-50'
                                  }
                                `}
                                onClick={() => {
                                  if (isSelected) {
                                    setRoleForm({
                                      ...roleForm,
                                      permissionIds: roleForm.permissionIds.filter(id => id !== permission.id),
                                    });
                                  } else {
                                    setRoleForm({
                                      ...roleForm,
                                      permissionIds: [...roleForm.permissionIds, permission.id],
                                    });
                                  }
                                }}
                              >
                                <div className="flex-shrink-0">
                                  {isSelected ? (
                                    <CheckSquare className="h-4 w-4 text-[#55c3c5]" />
                                  ) : (
                                    <Square className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-[#3b3a3e] break-words">
                                    {permission.name}
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            {permission.description && (
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-sm text-white">{permission.description}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                  </div>
                )}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  const handleRefresh = async () => {
    if (activeTab === 'sesiones') {
      await loadSessions();
    } else if (activeTab === 'usuarios') {
      await loadUsers(usersCurrentPage, userSearch);
    } else if (activeTab === 'roles') {
      await loadRoles(rolesCurrentPage);
    } else if (activeTab === 'permisos') {
      await loadPermissions(permissionsCurrentPage);
    }
  };

  useEffect(() => {
    if (!apiService) return;
    
    if (activeTab === 'usuarios') {
      // Solo cargar si no hay búsqueda activa, para evitar sobreescribir resultados
      if (!userSearch) {
        loadUsers(0);
      }
    } else if (activeTab === 'roles') {
      loadRoles(0);
    } else if (activeTab === 'permisos') {
      loadPermissions(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, apiService]);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3b3a3e]">Usuarios</h1>
          <p className="text-[#6b6a6e] mt-1">Gestiona usuarios, roles, permisos y sesiones</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="sesiones" className="gap-2">
            <Monitor className="h-4 w-4" />
            Sesiones
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permisos" className="gap-2">
            <Key className="h-4 w-4" />
            Permisos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sesiones">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Sesiones Activas
                  </CardTitle>
                  <CardDescription>
                    Visualiza y gestiona las sesiones activas de los usuarios
                  </CardDescription>
                </div>
                {sessions.length > 0 && (
                  <Button
                    onClick={handleRevokeAllSessions}
                    disabled={revokingAll}
                    variant="destructive"
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {revokingAll ? 'Cerrando...' : 'Cerrar Todas las Sesiones'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b6a6e] pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="Buscar por email (opcional, deja vacío para tus sesiones)..."
                    value={sessionUserEmail}
                    onChange={(e) => setSessionUserEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadSessions()}
                    className="pl-9"
                  />
                </div>
                <Button 
                  onClick={loadSessions} 
                  disabled={sessionsLoading}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  {sessionsLoading ? 'Buscando...' : 'Buscar'}
                </Button>
                {sessionUserEmail && (
                  <Button 
                    onClick={() => { 
                      setSessionUserEmail(''); 
                      setSessions([]);
                    }} 
                    variant="outline"
                    disabled={sessionsLoading}
                  >
                    Limpiar
                  </Button>
                )}
              </div>

              {sessionsLoading ? (
                <div className="text-center py-8 text-[#6b6a6e]">Cargando sesiones...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-[#6b6a6e]">
                  {sessionUserEmail 
                    ? `No se encontraron sesiones para ${sessionUserEmail}`
                    : 'No hay sesiones activas. Busca por email para ver sesiones de otros usuarios.'}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {sessions.map((session, idx) => (
                      <Card key={session.familyId || idx} className="border-l-4 border-l-[#55c3c5]">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Monitor className="h-5 w-5 text-[#6b6a6e]" />
                                  <h3 className="font-semibold text-[#3b3a3e]">
                                    {session.deviceLabel || 'Dispositivo desconocido'}
                                  </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-[#6b6a6e]">
                                  <div>
                                    <span className="font-medium">IP:</span> {session.lastIp || 'N/A'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Última actividad:</span>{' '}
                                    {format(new Date(session.lastRefreshAt), 'PPpp', { locale: es })}
                                  </div>
                                  <div>
                                    <span className="font-medium">Primera vez:</span>{' '}
                                    {format(new Date(session.firstSeenAt), 'PPpp', { locale: es })}
                                  </div>
                                  <div>
                                    <span className="font-medium">User Agent:</span>{' '}
                                    <span className="text-xs">{session.lastUserAgent?.substring(0, 50)}...</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {session.fcmTokens && session.fcmTokens.length > 0 && (
                              <div className="border-t pt-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Key className="h-4 w-4 text-[#6b6a6e]" />
                                  <span className="text-sm font-medium text-[#3b3a3e]">
                                    Tokens FCM ({session.fcmTokens.length})
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {session.fcmTokens.map((token) => (
                                    <div key={token.id} className="bg-[#f8f9fa] p-2 rounded text-xs">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={token.active ? "default" : "secondary"} className="text-xs">
                                          {token.active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                        {token.platform && (
                                          <Badge variant="outline" className="text-xs">
                                            {token.platform}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-[#6b6a6e] space-y-1">
                                        {token.deviceLabel && (
                                          <div><span className="font-medium">Dispositivo:</span> {token.deviceLabel}</div>
                                        )}
                                        <div className="truncate">
                                          <span className="font-medium">Token:</span> {token.fcmToken.substring(0, 50)}...
                                        </div>
                                        {token.lastUsedAt && (
                                          <div>
                                            <span className="font-medium">Último uso:</span>{' '}
                                            {format(new Date(token.lastUsedAt), 'PPpp', { locale: es })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
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

        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Lista de Usuarios
                  </CardTitle>
                  <CardDescription>
                    {usersTotalElements} usuario{usersTotalElements !== 1 ? 's' : ''} encontrado{usersTotalElements !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b6a6e] pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Buscar por email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleUserSearch} variant="outline" disabled={usersLoading}>
                  Buscar
                </Button>
                {userSearch && (
                  <Button 
                    onClick={() => { 
                      setUserSearch(''); 
                      setUsersCurrentPage(0);
                      loadUsers(0); 
                    }} 
                    variant="outline"
                    disabled={usersLoading}
                  >
                    Limpiar
                  </Button>
                )}
              </div>

              {usersLoading ? (
                <div className="text-center py-8 text-[#6b6a6e]">Cargando usuarios...</div>
              ) : users.length === 0 && !userSearch ? (
                <div className="text-center py-8 text-[#6b6a6e]">No hay usuarios. Usa el buscador para encontrar usuarios.</div>
              ) : users.length === 0 && userSearch ? (
                <div className="text-center py-8 text-[#6b6a6e]">No se encontraron usuarios con ese criterio de búsqueda.</div>
              ) : (
                <>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {users.map((user) => (
                        <Card key={user.id} className="border-l-4 border-l-[#55c3c5]">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <UserIcon className="h-5 w-5 text-[#6b6a6e]" />
                                  <h3 className="font-semibold text-[#3b3a3e]">
                                    {user.name} {user.lastName}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-4 mb-2 text-sm text-[#6b6a6e]">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {user.email}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(user.createdAt), 'PP', { locale: es })}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {user.roles.map((role) => (
                                    <Badge key={role.id} variant="outline" className="bg-[#55c3c5]/10">
                                      {role.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenUserRoleDialog(user)}
                                className="gap-2"
                              >
                                <Edit2 className="h-4 w-4" />
                                Asignar Rol
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {usersTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-[#6b6a6e]">
                        Página {usersCurrentPage + 1} de {usersTotalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadUsers(usersCurrentPage - 1, userSearch)}
                          disabled={usersCurrentPage === 0 || usersLoading}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadUsers(usersCurrentPage + 1, userSearch)}
                          disabled={usersCurrentPage >= usersTotalPages - 1 || usersLoading}
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

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Gestión de Roles
                  </CardTitle>
                  <CardDescription>
                    {rolesTotalElements} rol{rolesTotalElements !== 1 ? 'es' : ''} encontrado{rolesTotalElements !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenRoleDialog()} className="gap-2 bg-[#55c3c5] hover:bg-[#4ab3b5]">
                  <Plus className="h-4 w-4" />
                  Nuevo Rol
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#55c3c5] mx-auto mb-2" />
                  <p className="text-[#6b6a6e]">Cargando roles...</p>
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-[#6b6a6e] mx-auto mb-4 opacity-50" />
                  <p className="text-[#6b6a6e] mb-2">No hay roles registrados</p>
                  <p className="text-sm text-[#6b6a6e] mb-4">Crea uno nuevo para comenzar</p>
                  <Button onClick={() => handleOpenRoleDialog()} className="gap-2 bg-[#55c3c5] hover:bg-[#4ab3b5]">
                    <Plus className="h-4 w-4" />
                    Crear Primer Rol
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {roles.map((role) => {
                      return (
                        <Card 
                          key={role.id} 
                          className="bg-white border-l-4 border-l-[#55c3c5] hover:shadow-lg hover:border-l-[#4ab3b5] transition-all duration-200 cursor-pointer group"
                        >
                          <CardContent className="p-6">
                            <div className="flex flex-col h-full">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-3 rounded-lg bg-[#55c3c5]/10 text-[#55c3c5] shadow-sm group-hover:bg-[#55c3c5]/20 transition-colors">
                                    <Shield className="h-6 w-6" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg text-[#3b3a3e] group-hover:text-[#55c3c5] transition-colors">
                                      {role.name}
                                    </h3>
                                    <p className="text-xs text-[#6b6a6e] mt-1">ID: {role.id}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-auto pt-4 border-t border-[#55c3c5]/20">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRoleDialog(role);
                                    }}
                                    className="flex-1 border-[#55c3c5]/30 hover:bg-[#55c3c5]/10 hover:border-[#55c3c5] hover:text-[#55c3c5] transition-colors"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRole(role.id);
                                    }}
                                    className="border-red-300 hover:bg-red-50 hover:border-red-400 text-red-600 hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {rolesTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-[#6b6a6e]">
                        Página {rolesCurrentPage + 1} de {rolesTotalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadRoles(rolesCurrentPage - 1)}
                          disabled={rolesCurrentPage === 0 || rolesLoading}
                          className="gap-2"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${rolesCurrentPage === 0 ? 'opacity-50' : ''}`} />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadRoles(rolesCurrentPage + 1)}
                          disabled={rolesCurrentPage >= rolesTotalPages - 1 || rolesLoading}
                          className="gap-2"
                        >
                          Siguiente
                          <RefreshCw className={`h-3.5 w-3.5 rotate-180 ${rolesCurrentPage >= rolesTotalPages - 1 ? 'opacity-50' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permisos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Gestión de Permisos
                  </CardTitle>
                  <CardDescription>
                    {permissionsTotalElements} permiso{permissionsTotalElements !== 1 ? 's' : ''} encontrado{permissionsTotalElements !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenPermissionDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Permiso
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="text-center py-8 text-[#6b6a6e]">Cargando permisos...</div>
              ) : permissions.length === 0 ? (
                <div className="text-center py-8 text-[#6b6a6e]">No hay permisos. Crea uno nuevo para comenzar.</div>
              ) : (
                <>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {permissions.map((permission) => (
                        <Card key={permission.id} className="border-l-4 border-l-[#55c3c5]">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Key className="h-5 w-5 text-[#6b6a6e]" />
                                  <h3 className="font-semibold text-[#3b3a3e]">{permission.name}</h3>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenPermissionDialog(permission)}
                                  className="gap-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeletePermission(permission.id)}
                                  className="gap-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {permissionsTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-[#6b6a6e]">
                        Página {permissionsCurrentPage + 1} de {permissionsTotalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadPermissions(permissionsCurrentPage - 1)}
                          disabled={permissionsCurrentPage === 0 || permissionsLoading}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadPermissions(permissionsCurrentPage + 1)}
                          disabled={permissionsCurrentPage >= permissionsTotalPages - 1 || permissionsLoading}
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
      </Tabs>

      {/* Dialog para crear/editar rol */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Modifica los campos del rol'
                : 'Crea un nuevo rol con permisos asociados'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nombre del Rol *</Label>
              <Input
                id="roleName"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="ej: ADMIN, USUARIO"
                disabled={!!editingRole}
              />
            </div>

            <div className="space-y-2">
              <Label>Permisos</Label>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                {availablePermissions.length === 0 ? (
                  <div className="text-sm text-[#6b6a6e] text-center py-4">
                    Cargando permisos...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`permission-${permission.id}`}
                          checked={roleForm.permissionIds.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoleForm({
                                ...roleForm,
                                permissionIds: [...roleForm.permissionIds, permission.id],
                              });
                            } else {
                              setRoleForm({
                                ...roleForm,
                                permissionIds: roleForm.permissionIds.filter(id => id !== permission.id),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <label
                          htmlFor={`permission-${permission.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRole} className="bg-[#55c3c5] hover:bg-[#4ab3b5]">
              {editingRole ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear/editar rol */}
      <Dialog open={isRoleDialogOpen} onOpenChange={(open) => {
        setIsRoleDialogOpen(open);
        if (!open) {
          setPermissionSearch('');
          setEditingRole(null);
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Modifica los campos del rol y sus permisos asociados'
                : 'Crea un nuevo rol con permisos asociados'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nombre del Rol *</Label>
              <Input
                id="roleName"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="ej: ADMIN, USUARIO"
                disabled={!!editingRole}
                className="text-base"
              />
            </div>

            {renderPermissionsSelector()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRoleDialogOpen(false);
              setPermissionSearch('');
              setEditingRole(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRole} className="bg-[#55c3c5] hover:bg-[#4ab3b5]">
              {editingRole ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para asignar rol a usuario */}
      <Dialog open={isUserRoleDialogOpen} onOpenChange={setIsUserRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Rol a Usuario</DialogTitle>
            <DialogDescription>
              Asigna un rol al usuario {selectedUser?.name} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleType">Rol *</Label>
              <Select 
                value={selectedRoleId?.toString() || ''} 
                onValueChange={(value) => setSelectedRoleId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserRole} className="bg-[#55c3c5] hover:bg-[#4ab3b5]">
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear/editar permiso */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPermission ? 'Editar Permiso' : 'Nuevo Permiso'}
            </DialogTitle>
            <DialogDescription>
              {editingPermission 
                ? 'Modifica el nombre y descripción del permiso'
                : 'Crea un nuevo permiso con nombre y descripción'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="permissionName">Nombre del Permiso *</Label>
              <Input
                id="permissionName"
                value={permissionForm.name}
                onChange={(e) => setPermissionForm({ ...permissionForm, name: e.target.value })}
                placeholder="ej: CREATE_USER, DELETE_ROLE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permissionDescription">Descripción</Label>
              <Textarea
                id="permissionDescription"
                value={permissionForm.description || ''}
                onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
                placeholder="Descripción breve del permiso"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermission} className="bg-[#55c3c5] hover:bg-[#4ab3b5]">
              {editingPermission ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
