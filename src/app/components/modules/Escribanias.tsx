import React, { useState, useEffect, useRef } from 'react';
import { useNotaryOffices } from '../../hooks/use-notary-offices';
import { useAuth } from '../../contexts/AuthContext';
import { useProdPromotion } from '../../contexts/ProdPromotionContext';
import {
  NotaryOfficeResponse,
  NotaryOfficeRequest,
  NotaryOfficeUpdateRequest,
  AddressRequest,
  PaginationResponse,
  StateResponse,
  CityResponse,
} from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
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
import { Building2, RefreshCw, Search, Plus, Edit2, Eye, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const emptyAddressRequest: AddressRequest = {
  cityId: null,
  stateId: 0,
  street: '',
  streetNumber: '',
  neighborhood: '',
  floor: '',
  department: '',
  postalCode: '',
};

function formatAddress(addr: NotaryOfficeResponse['address']): string {
  if (!addr) return '—';
  const parts: string[] = [];
  if (addr.street) parts.push(addr.street);
  if (addr.streetNumber) parts.push(addr.streetNumber);
  if (addr.neighborhood) parts.push(addr.neighborhood);
  if (addr.city?.name) parts.push(addr.city.name);
  if (addr.state?.name) parts.push(addr.state.name);
  if (addr.postalCode) parts.push(addr.postalCode);
  return parts.length ? parts.join(', ') : '—';
}

export function Escribanias() {
  const notaryApi = useNotaryOffices();
  const { environment } = useAuth();
  const { openPromoteFlow } = useProdPromotion();
  const [list, setList] = useState<NotaryOfficeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchName, setSearchName] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [pageSize] = useState(10);

  const [detailItem, setDetailItem] = useState<NotaryOfficeResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NotaryOfficeRequest>({
    name: '',
    address: { ...emptyAddressRequest },
  });
  const [saving, setSaving] = useState(false);

  const [states, setStates] = useState<StateResponse[]>([]);
  const [cities, setCities] = useState<CityResponse[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const loadList = async (pageNum: number = 0, nameFilter?: string) => {
    if (!notaryApi.hasApi) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: pageNum.toString(),
        size: pageSize.toString(),
      };
      const term = (nameFilter ?? searchInputRef.current?.value ?? '').trim();
      if (term) {
        params.name = term;
      }
      const response = await notaryApi.getNotaryOffices(params);
      if (response.code === 200 && response.data) {
        const data = response.data as PaginationResponse<NotaryOfficeResponse>;
        setList(data.content || []);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? 0);
        setPage(data.number ?? 0);
      } else {
        setList([]);
        toast.error(response.message || 'Error al cargar escribanías');
      }
    } catch (error) {
      setList([]);
      toast.error(error instanceof Error ? error.message : 'Error al cargar escribanías');
    } finally {
      setLoading(false);
    }
  };

  const loadStates = async () => {
    if (!notaryApi.hasApi) return;
    try {
      const response = await notaryApi.getStates({ page: '0', size: '100' });
      if (response.code === 200 && response.data) {
        setStates((response.data as PaginationResponse<StateResponse>).content || []);
      }
    } catch {
      setStates([]);
    }
  };

  const loadCities = async (stateId: number) => {
    if (!notaryApi.hasApi || !stateId) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    try {
      const response = await notaryApi.getCities({
        page: '0',
        size: '500',
        eq: `stateId:${stateId}`,
      });
      if (response.code === 200 && response.data) {
        setCities((response.data as PaginationResponse<CityResponse>).content || []);
      } else {
        setCities([]);
      }
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  };

  useEffect(() => {
    if (!notaryApi.hasApi) return;
    const timer = setTimeout(() => {
      setPage(0);
      loadList(0, searchName);
    }, 300);
    return () => clearTimeout(timer);
  }, [notaryApi.hasApi, searchName]);

  useEffect(() => {
    if (form.address.stateId) {
      loadCities(form.address.stateId);
    } else {
      setCities([]);
    }
  }, [form.address.stateId]);

  const handleSearch = () => {
    const currentSearch = searchInputRef.current?.value ?? searchName;
    setSearchName(currentSearch);
    setPage(0);
    loadList(0, currentSearch);
  };

  const handleOpenDetail = (item: NotaryOfficeResponse) => {
    setDetailItem(item);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      name: '',
      address: { ...emptyAddressRequest },
    });
    loadStates();
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (item: NotaryOfficeResponse) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      address: item.address
        ? {
            cityId: item.address.city?.id ?? null,
            stateId: item.address.state?.id ?? 0,
            street: item.address.street ?? '',
            streetNumber: item.address.streetNumber ?? '',
            neighborhood: item.address.neighborhood ?? '',
            floor: item.address.floor ?? '',
            department: item.address.department ?? '',
            postalCode: item.address.postalCode ?? '',
          }
        : { ...emptyAddressRequest },
    });
    await loadStates();
    if (item.address?.state?.id) {
      await loadCities(item.address.state.id);
    } else {
      setCities([]);
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!notaryApi.hasApi) return;
    if (!form.name.trim()) {
      toast.error('El nombre de la escribanía es obligatorio');
      return;
    }
    if (!form.address.stateId) {
      toast.error('La provincia es obligatoria');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: {
          cityId: form.address.cityId || null,
          stateId: form.address.stateId,
          street: form.address.street || null,
          streetNumber: form.address.streetNumber || null,
          neighborhood: form.address.neighborhood || null,
          floor: form.address.floor || null,
          department: form.address.department || null,
          postalCode: form.address.postalCode || null,
        },
      };
      if (editingId != null) {
        const response = await notaryApi.updateNotaryOffice(editingId, payload as NotaryOfficeUpdateRequest);
        if (response.code === 200) {
          toast.success('Escribanía actualizada correctamente');
          setIsFormOpen(false);
          await loadList(page, searchName);
        } else {
          toast.error(response.message || 'Error al actualizar');
        }
      } else {
        const response = await notaryApi.createNotaryOffice(payload as NotaryOfficeRequest);
        if (response.code === 200) {
          toast.success('Escribanía creada correctamente');
          setIsFormOpen(false);
          await loadList(0, searchName);
        } else {
          toast.error(response.message || 'Error al crear');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3b3a3e]">Escribanías</h1>
          <p className="text-[#6b6a6e] mt-1">Listado, alta, edición y detalle de escribanías</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadList(page, searchName)} variant="outline" className="gap-2" disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2 bg-[#55c3c5] hover:bg-[#4ab3b5]">
            <Plus className="h-4 w-4" />
            Nueva Escribanía
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Listado de Escribanías
          </CardTitle>
          <CardDescription>
            {totalElements} escribanía{totalElements !== 1 ? 's' : ''} encontrada{totalElements !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6a6e] pointer-events-none" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nombre..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} variant="outline" disabled={loading}>
              Buscar
            </Button>
            {searchName && (
              <Button
                onClick={() => {
                  setSearchName('');
                  setPage(0);
                  loadList(0, '');
                }}
                variant="outline"
                disabled={loading}
              >
                Limpiar
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-[#6b6a6e]">Cargando escribanías...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-8 text-[#6b6a6e]">
              No hay escribanías. Creá una nueva o ajustá el filtro.
            </div>
          ) : (
            <>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {list.map((item) => (
                    <Card key={item.id} className="border-l-4 border-l-[#55c3c5]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#3b3a3e]">{item.name}</h3>
                            <p className="text-sm text-[#6b6a6e] mt-1">{formatAddress(item.address)}</p>
                            {item.createdAt && (
                              <p className="text-xs text-[#6b6a6e] mt-1">
                                Creado: {format(new Date(item.createdAt), 'PP', { locale: es })}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDetail(item)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(item)}
                              className="gap-1"
                            >
                              <Edit2 className="h-4 w-4" />
                              Editar
                            </Button>
                            {environment === 'development' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openPromoteFlow('notary_office', {
                                    name: item.name,
                                    address: item.address,
                                  })
                                }
                                className="gap-1"
                                title="Subir esta escribanía a producción"
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-[#6b6a6e]">
                    Página {page + 1} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadList(page - 1, searchName)}
                      disabled={page === 0 || loading}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadList(page + 1, searchName)}
                      disabled={page >= totalPages - 1 || loading}
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

      {/* Dialog Ver detalle */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {detailItem?.name}
            </DialogTitle>
            <DialogDescription>Detalle de la escribanía</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-[#6b6a6e]">Nombre</Label>
                <p className="font-medium text-[#3b3a3e]">{detailItem.name}</p>
              </div>
              <div>
                <Label className="text-[#6b6a6e]">Dirección</Label>
                <p className="text-[#3b3a3e]">{formatAddress(detailItem.address)}</p>
                {detailItem.address && (
                  <div className="mt-2 text-sm text-[#6b6a6e] space-y-1">
                    {detailItem.address.street && <div>Calle: {detailItem.address.street} {detailItem.address.streetNumber}</div>}
                    {detailItem.address.neighborhood && <div>Barrio: {detailItem.address.neighborhood}</div>}
                    {(detailItem.address.floor || detailItem.address.department) && (
                      <div>Piso/Depto: {[detailItem.address.floor, detailItem.address.department].filter(Boolean).join(' ')}</div>
                    )}
                    {detailItem.address.postalCode && <div>CP: {detailItem.address.postalCode}</div>}
                  </div>
                )}
              </div>
              {detailItem.createdAt && (
                <div>
                  <Label className="text-[#6b6a6e]">Fecha de creación</Label>
                  <p className="text-[#3b3a3e]">{format(new Date(detailItem.createdAt), 'PPpp', { locale: es })}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailItem(null)}>
              Cerrar
            </Button>
            {detailItem && (
              <Button onClick={() => { setDetailItem(null); handleOpenEdit(detailItem); }} className="bg-[#55c3c5] hover:bg-[#4ab3b5]">
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Crear / Editar */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) setIsFormOpen(false);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId != null ? 'Editar Escribanía' : 'Nueva Escribanía'}</DialogTitle>
            <DialogDescription>
              {editingId != null ? 'Modificá los datos de la escribanía' : 'Completá nombre y dirección'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notary-name">Nombre *</Label>
              <Input
                id="notary-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Escribanía López"
              />
            </div>
            <div className="space-y-2">
              <Label>Provincia *</Label>
              <Select
                value={form.address.stateId ? String(form.address.stateId) : ''}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    address: {
                      ...form.address,
                      stateId: v ? Number(v) : 0,
                      cityId: null,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar provincia" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Select
                value={form.address.cityId ? String(form.address.cityId) : ''}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    address: { ...form.address, cityId: v ? Number(v) : null },
                  })
                }
                disabled={!form.address.stateId || citiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={citiesLoading ? 'Cargando...' : 'Seleccionar ciudad'} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calle</Label>
                <Input
                  value={form.address.street ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: { ...form.address, street: e.target.value || null },
                    })
                  }
                  placeholder="Calle"
                />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  value={form.address.streetNumber ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: { ...form.address, streetNumber: e.target.value || null },
                    })
                  }
                  placeholder="Número"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Barrio</Label>
              <Input
                value={form.address.neighborhood ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, neighborhood: e.target.value || null },
                  })
                }
                placeholder="Barrio"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Piso</Label>
                <Input
                  value={form.address.floor ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: { ...form.address, floor: e.target.value || null },
                    })
                  }
                  placeholder="Piso"
                />
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Input
                  value={form.address.department ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: { ...form.address, department: e.target.value || null },
                    })
                  }
                  placeholder="Depto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Código postal</Label>
              <Input
                value={form.address.postalCode ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, postalCode: e.target.value || null },
                  })
                }
                placeholder="CP"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#55c3c5] hover:bg-[#4ab3b5]">
              {saving ? 'Guardando...' : editingId != null ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
