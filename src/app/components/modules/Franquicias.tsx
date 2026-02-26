import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFranchises } from '../../hooks/use-franchises';
import { useNotaryOffices } from '../../hooks/use-notary-offices';
import { useAuth } from '../../contexts/AuthContext';
import { useProdPromotion } from '../../contexts/ProdPromotionContext';
import type {
  FranchiseResponse,
  PaginationResponse,
  StateResponse,
  CityResponse,
} from '../../services/api';
import type { CoverageAreaRequest } from '../../types/dto';
import { CoverageAreaEditor } from '../CoverageAreaEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { TablePagination } from '../ui/table-pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Store, RefreshCw, Search, Eye, Plus, Edit2, ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const emptyCoverage: CoverageAreaRequest[] = [{ stateId: 0, cityId: null }];

export function Franquicias() {
  const franchisesApi = useFranchises();
  const notaryApi = useNotaryOffices();
  const { environment } = useAuth();
  const { openPromoteFlow } = useProdPromotion();
  const [list, setList] = useState<FranchiseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchName, setSearchName] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [pageSize] = useState(10);
  const [detailItem, setDetailItem] = useState<FranchiseResponse | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formCoverage, setFormCoverage] = useState<CoverageAreaRequest[]>(emptyCoverage);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState<StateResponse[]>([]);

  const loadCitiesForState = useCallback(
    async (stateId: number): Promise<CityResponse[]> => {
      if (!notaryApi.hasApi || !stateId) return [];
      const response = await notaryApi.getCities({
        page: '0',
        size: '500',
        eq: `stateId:${stateId}`,
      });
      if (response.code === 200 && response.data) {
        return (response.data as PaginationResponse<CityResponse>).content ?? [];
      }
      return [];
    },
    [notaryApi]
  );

  const loadList = async (pageNum: number = 0, nameFilter?: string) => {
    if (!franchisesApi.hasApi) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: pageNum.toString(),
        size: pageSize.toString(),
      };
      const term = (nameFilter ?? searchInputRef.current?.value ?? '').trim();
      if (term) params.name = term;
      const response = await franchisesApi.getFranchises(params);
      if (response.code === 200 && response.data) {
        const data = response.data as PaginationResponse<FranchiseResponse>;
        setList(data.content ?? []);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? 0);
        setPage(data.number ?? 0);
      } else {
        setList([]);
        toast.error(response.message || 'Ocurrió un error');
      }
    } catch (error) {
      setList([]);
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  const loadStates = useCallback(async () => {
    if (!notaryApi.hasApi) return;
    try {
      const response = await notaryApi.getStates({ page: '0', size: '100' });
      if (response.code === 200 && response.data) {
        setStates((response.data as PaginationResponse<StateResponse>).content ?? []);
      }
    } catch {
      setStates([]);
    }
  }, [notaryApi]);

  useEffect(() => {
    if (!franchisesApi.hasApi) return;
    const timer = setTimeout(() => {
      setPage(0);
      loadList(0, searchName);
    }, 300);
    return () => clearTimeout(timer);
  }, [franchisesApi.hasApi, searchName]);

  const handleSearch = () => {
    const currentSearch = searchInputRef.current?.value ?? searchName;
    setSearchName(currentSearch);
    setPage(0);
    loadList(0, currentSearch);
  };

  const handleOpenDetail = (item: FranchiseResponse) => {
    setDetailItem(item);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormResponsible('');
    setFormCoverage(states.length ? [{ stateId: states[0].id, cityId: null }] : emptyCoverage);
    loadStates();
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (item: FranchiseResponse) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormEmail(item.email ?? '');
    setFormPhone(item.phone ?? '');
    setFormResponsible(item.responsible ?? '');
    setFormCoverage(
      item.coverage && item.coverage.length > 0
        ? item.coverage.map((a) => ({ stateId: a.stateId, cityId: a.cityId }))
        : emptyCoverage
    );
    await loadStates();
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!franchisesApi.hasApi) return;
    const name = formName.trim();
    if (!name) {
      toast.error('El nombre es obligatorio');
      return;
    }
    const coverage = formCoverage.filter((a) => a.stateId > 0);
    if (coverage.length === 0) {
      toast.error('Agregá al menos una zona de cobertura con provincia seleccionada');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        responsible: formResponsible.trim() || undefined,
        coverage,
      };
      if (editingId != null) {
        const response = await franchisesApi.updateFranchise(editingId, payload);
        if (response.code === 200) {
          toast.success('Franquicia actualizada correctamente');
          setIsFormOpen(false);
          await loadList(page, searchName);
        } else {
          toast.error(response.message || 'Ocurrió un error');
        }
      } else {
        const response = await franchisesApi.createFranchise(payload);
        if (response.code === 200 || response.code === 201) {
          toast.success('Franquicia creada correctamente');
          setIsFormOpen(false);
          await loadList(0, searchName);
        } else {
          toast.error(response.message || 'Ocurrió un error');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error');
    } finally {
      setSaving(false);
    }
  };

  if (isFormOpen) {
    return (
      <div className="flex flex-col h-full min-h-0 p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFormOpen(false)}
            className="gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#3b3a3e] truncate">
              {editingId != null ? 'Editar franquicia' : 'Nueva franquicia'}
            </h1>
            <p className="text-sm text-[#6b6a6e]">
              {editingId != null ? 'Modificá los datos y las zonas de cobertura' : 'Completá los datos y las zonas de cobertura'}
            </p>
          </div>
        </div>
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="max-w-2xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="franchise-name">Nombre *</Label>
                <Input
                  id="franchise-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Franquicia Centro"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="franchise-email">Email</Label>
                  <Input
                    id="franchise-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="franchise-phone">Teléfono</Label>
                  <Input
                    id="franchise-phone"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="franchise-responsible">Responsable</Label>
                <Input
                  id="franchise-responsible"
                  value={formResponsible}
                  onChange={(e) => setFormResponsible(e.target.value)}
                  placeholder="Nombre del responsable"
                />
              </div>
              <CoverageAreaEditor
                value={formCoverage}
                onChange={setFormCoverage}
                states={states}
                onLoadCities={loadCitiesForState}
                disabled={saving}
              />
            </div>
          </CardContent>
          <div className="shrink-0 border-t p-4 flex gap-2 justify-end bg-[#f8f9fa]/50">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#55c3c5] hover:bg-[#4ab3b5]">
              {saving ? 'Guardando…' : editingId != null ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3b3a3e]">Franquicias</h1>
          <p className="text-[#6b6a6e] mt-1">Listado, creación y edición de franquicias con cobertura</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadList(page, searchName)} variant="outline" className="gap-2" disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2 bg-[#55c3c5] hover:bg-[#4ab3b5]">
            <Plus className="h-4 w-4" />
            Nueva franquicia
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Listado de Franquicias
          </CardTitle>
          <CardDescription>
            {totalElements} franquicia{totalElements !== 1 ? 's' : ''} encontrada{totalElements !== 1 ? 's' : ''}
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
            <div className="text-center py-8 text-[#6b6a6e]">Cargando…</div>
          ) : list.length === 0 ? (
            <div className="text-center py-8 text-[#6b6a6e]">No hay resultados</div>
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
                            {item.email && (
                              <p className="text-sm text-[#6b6a6e] mt-1">{item.email}</p>
                            )}
                            {item.coverage && item.coverage.length > 0 && (
                              <p className="text-sm text-[#6b6a6e]">
                                {item.coverage.length} zona{item.coverage.length !== 1 ? 's' : ''} de cobertura
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" variant="outline" onClick={() => handleOpenDetail(item)} className="gap-1">
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)} className="gap-1">
                              <Edit2 className="h-4 w-4" />
                              Editar
                            </Button>
                            {environment === 'development' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openPromoteFlow('franchise', {
                                    name: item.name,
                                    email: item.email,
                                    phone: item.phone,
                                    responsible: item.responsible,
                                    coverage: item.coverage ?? [],
                                  })
                                }
                                className="gap-1"
                                title="Subir esta franquicia a producción"
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
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => loadList(p, searchName)}
                    disabled={loading}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {detailItem?.name}
            </DialogTitle>
            <DialogDescription>Detalle de la franquicia</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-[#6b6a6e]">Nombre</Label>
                <p className="font-medium text-[#3b3a3e]">{detailItem.name}</p>
              </div>
              {detailItem.email && (
                <div>
                  <Label className="text-[#6b6a6e]">Email</Label>
                  <p className="text-[#3b3a3e]">{detailItem.email}</p>
                </div>
              )}
              {detailItem.phone && (
                <div>
                  <Label className="text-[#6b6a6e]">Teléfono</Label>
                  <p className="text-[#3b3a3e]">{detailItem.phone}</p>
                </div>
              )}
              {detailItem.responsible && (
                <div>
                  <Label className="text-[#6b6a6e]">Responsable</Label>
                  <p className="text-[#3b3a3e]">{detailItem.responsible}</p>
                </div>
              )}
              {detailItem.createdAt && (
                <div>
                  <Label className="text-[#6b6a6e]">Fecha de creación</Label>
                  <p className="text-[#3b3a3e]">
                    {format(new Date(detailItem.createdAt), 'PP', { locale: es })}
                  </p>
                </div>
              )}
              {detailItem.coverage && detailItem.coverage.length > 0 && (
                <div>
                  <Label className="text-[#6b6a6e]">Cobertura</Label>
                  <ul className="mt-2 text-sm text-[#3b3a3e] space-y-1">
                    {detailItem.coverage.map((area, idx) => (
                      <li key={idx}>
                        Provincia ID: {area.stateId}
                        {area.cityId != null ? ` · Ciudad ID: ${area.cityId}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailItem(null)}>Cerrar</Button>
            {detailItem && (
              <Button
                className="bg-[#55c3c5] hover:bg-[#4ab3b5]"
                onClick={() => {
                  setDetailItem(null);
                  handleOpenEdit(detailItem);
                }}
              >
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
