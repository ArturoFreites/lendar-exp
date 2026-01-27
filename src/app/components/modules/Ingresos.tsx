import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ApplicationReceivedResponse, PaginationResponse } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { TrendingUp, DollarSign, Users, FileText, CheckCircle2, Clock, XCircle, ListOrdered, Eye, Loader2, ArrowLeft, Search, FilterX } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

function startOfDayISO(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayISO(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

export function Ingresos() {
  const { apiService } = useAuth();
  const [activeTab, setActiveTab] = useState('prestamos');

  // Registro de ingresos = application-received
  const [applicationsReceived, setApplicationsReceived] = useState<ApplicationReceivedResponse[]>([]);
  const [receivedPagination, setReceivedPagination] = useState<PaginationResponse<ApplicationReceivedResponse> | null>(null);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [selectedReceivedId, setSelectedReceivedId] = useState<number | null>(null);
  const [receivedDetail, setReceivedDetail] = useState<ApplicationReceivedResponse | null>(null);
  const [receivedDetailLoading, setReceivedDetailLoading] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterDetail, setFilterDetail] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const buildRegistroParams = (): Record<string, string> => {
    const p: Record<string, string> = { page: '0', size: '50', sort: 'createdAt:desc' };
    if (filterDetail.trim()) p.contains = 'detail:' + filterDetail.trim();
    if (filterStatus.trim()) p.eq = 'status:' + filterStatus.trim();
    if (filterDateFrom) p.gte = 'createdAt:' + startOfDayISO(filterDateFrom);
    if (filterDateTo) p.lte = 'createdAt:' + endOfDayISO(filterDateTo);
    return p;
  };

  const loadRegistroIngresos = async () => {
    if (!apiService) return;
    setReceivedLoading(true);
    try {
      const params = buildRegistroParams();
      const res = await apiService.getApplicationsReceived(params);
      if (res.data) {
        setApplicationsReceived(res.data.content ?? []);
        setReceivedPagination(res.data);
      } else {
        setApplicationsReceived([]);
      }
    } catch {
      toast.error('Error al cargar el registro de ingresos');
      setApplicationsReceived([]);
    } finally {
      setReceivedLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadRegistroIngresos();
  };

  const handleClearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDetail('');
    setFilterStatus('');
    setSelectedReceivedId(null);
    setReceivedDetail(null);
  };

  const handleClearFiltersAndReload = () => {
    handleClearFilters();
    if (apiService) {
      setReceivedLoading(true);
      apiService.getApplicationsReceived({ page: '0', size: '50', sort: 'createdAt:desc' }).then((res) => {
        if (res.data) {
          setApplicationsReceived(res.data.content ?? []);
          setReceivedPagination(res.data);
        } else setApplicationsReceived([]);
      }).catch(() => {
        toast.error('Error al cargar el registro de ingresos');
        setApplicationsReceived([]);
      }).finally(() => setReceivedLoading(false));
    }
  };

  const handleSelectReceived = async (id: number) => {
    setSelectedReceivedId(id);
    setReceivedDetail(null);
    setReceivedDetailLoading(true);
    if (!apiService) return;
    try {
      const res = await apiService.getApplicationReceivedById(id);
      if (res.data) setReceivedDetail(res.data);
    } catch {
      toast.error('Error al cargar el detalle de la entrada');
    } finally {
      setReceivedDetailLoading(false);
    }
  };

  const handleBackToReceivedList = () => {
    setSelectedReceivedId(null);
    setReceivedDetail(null);
  };

  useEffect(() => {
    if (activeTab !== 'registro') {
      setSelectedReceivedId(null);
      setReceivedDetail(null);
      return;
    }
    if (apiService && selectedReceivedId == null) {
      loadRegistroIngresos();
    }
  }, [activeTab, apiService]);

  const statsPrestamos = [
    { label: 'Total Solicitudes', value: '1,247', icon: FileText, color: '#55c3c5', bgColor: 'bg-[#55c3c5]/10' },
    { label: 'Aprobadas', value: '892', icon: CheckCircle2, color: '#10b981', bgColor: 'bg-emerald-500/10' },
    { label: 'En Proceso', value: '213', icon: Clock, color: '#f59e0b', bgColor: 'bg-amber-500/10' },
    { label: 'Rechazadas', value: '142', icon: XCircle, color: '#ef4444', bgColor: 'bg-red-500/10' },
  ];

  const statsInversiones = [
    { label: 'Total Solicitudes', value: '584', icon: FileText, color: '#55c3c5', bgColor: 'bg-[#55c3c5]/10' },
    { label: 'Aprobadas', value: '421', icon: CheckCircle2, color: '#10b981', bgColor: 'bg-emerald-500/10' },
    { label: 'En Proceso', value: '98', icon: Clock, color: '#f59e0b', bgColor: 'bg-amber-500/10' },
    { label: 'Rechazadas', value: '65', icon: XCircle, color: '#ef4444', bgColor: 'bg-red-500/10' },
  ];

  const statsInversionistas = [
    { label: 'Total Inversores', value: '156', icon: Users, color: '#55c3c5', bgColor: 'bg-[#55c3c5]/10' },
    { label: 'Activos', value: '134', icon: CheckCircle2, color: '#10b981', bgColor: 'bg-emerald-500/10' },
    { label: 'Monto Invertido', value: '$2.4M', icon: DollarSign, color: '#3b82f6', bgColor: 'bg-blue-500/10' },
    { label: 'ROI Promedio', value: '12.5%', icon: TrendingUp, color: '#8b5cf6', bgColor: 'bg-purple-500/10' },
  ];

  const renderStats = (stats: typeof statsPrestamos) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border border-[#e8eaed] hover:border-[#55c3c5]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#55c3c5]/5 group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{ background: `radial-gradient(circle at top right, ${stat.color}, transparent)` }}></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-4xl font-semibold text-[#3b3a3e] mb-2 tracking-tight">{stat.value}</div>
              <p className="text-sm text-[#6b6a6e] font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="p-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-[#3b3a3e] mb-2 tracking-tight font-semibold">Ingresos</h1>
        <p className="text-[#6b6a6e] text-base">
          Estadísticas de solicitudes de préstamos, inversiones e inversionistas
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-[#e8eaed] p-1 rounded-xl inline-flex">
          <TabsTrigger 
            value="prestamos" 
            className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-lg px-6 py-2.5 font-medium transition-all"
          >
            Solicitudes de Préstamo
          </TabsTrigger>
          <TabsTrigger 
            value="inversiones" 
            className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-lg px-6 py-2.5 font-medium transition-all"
          >
            Solicitudes de Inversión
          </TabsTrigger>
          <TabsTrigger 
            value="inversionistas" 
            className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-lg px-6 py-2.5 font-medium transition-all"
          >
            Inversiones
          </TabsTrigger>
          <TabsTrigger 
            value="registro" 
            className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-lg px-6 py-2.5 font-medium transition-all"
          >
            Registro de ingresos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prestamos" className="space-y-6">
          <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
            <CardHeader className="border-b border-[#e8eaed] pb-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#55c3c5]/10">
                  <DollarSign className="h-6 w-6 text-[#55c3c5]" />
                </div>
                <div>
                  <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Solicitudes de Préstamo</CardTitle>
                  <p className="text-sm text-[#6b6a6e] mt-1">Estadísticas generales de préstamos</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {renderStats(statsPrestamos)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inversiones" className="space-y-6">
          <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
            <CardHeader className="border-b border-[#e8eaed] pb-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#55c3c5]/10">
                  <TrendingUp className="h-6 w-6 text-[#55c3c5]" />
                </div>
                <div>
                  <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Solicitudes de Inversión</CardTitle>
                  <p className="text-sm text-[#6b6a6e] mt-1">Estadísticas de solicitudes de inversión</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {renderStats(statsInversiones)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inversionistas" className="space-y-6">
          <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
            <CardHeader className="border-b border-[#e8eaed] pb-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#55c3c5]/10">
                  <Users className="h-6 w-6 text-[#55c3c5]" />
                </div>
                <div>
                  <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Inversiones</CardTitle>
                  <p className="text-sm text-[#6b6a6e] mt-1">Estadísticas de inversionistas activos</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {renderStats(statsInversionistas)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registro" className="space-y-6">
          <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
            <CardHeader className="border-b border-[#e8eaed] pb-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#55c3c5]/10">
                  <ListOrdered className="h-6 w-6 text-[#55c3c5]" />
                </div>
                <div>
                  <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Registro de ingresos (application-received)</CardTitle>
                  <p className="text-sm text-[#6b6a6e] mt-1">Entradas recibidas. Filtra por fechas, detalle o estado y selecciona una para ver el JSON.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-[#f8f9fa] border border-[#e8eaed]">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#3b3a3e] text-xs font-medium">Fecha desde</Label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-[160px] border-[#e8eaed]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#3b3a3e] text-xs font-medium">Fecha hasta</Label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-[160px] border-[#e8eaed]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#3b3a3e] text-xs font-medium">Detalle / nombre</Label>
                  <Input
                    type="text"
                    placeholder="Buscar en detalle..."
                    value={filterDetail}
                    onChange={(e) => setFilterDetail(e.target.value)}
                    className="w-[200px] border-[#e8eaed]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#3b3a3e] text-xs font-medium">Estado</Label>
                  <Input
                    type="text"
                    placeholder="Ej: recibido, procesado"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-[160px] border-[#e8eaed]"
                  />
                </div>
                <Button
                  onClick={handleApplyFilters}
                  className="bg-[#55c3c5] hover:bg-[#4ab3b5] text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFiltersAndReload}
                  className="border-[#e8eaed] text-[#6b6a6e] hover:bg-[#e8eaed]"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              </div>

              {selectedReceivedId != null ? (
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#55c3c5] text-[#55c3c5] hover:bg-[#55c3c5]/10"
                    onClick={handleBackToReceivedList}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a la lista
                  </Button>
                  {receivedDetailLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#55c3c5]" />
                    </div>
                  ) : receivedDetail ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4 text-sm text-[#6b6a6e]">
                        <span><strong>ID:</strong> {receivedDetail.id}</span>
                        {receivedDetail.detail != null && <span><strong>Detalle:</strong> {receivedDetail.detail}</span>}
                        {receivedDetail.status != null && <span><strong>Estado:</strong> {receivedDetail.status}</span>}
                        {receivedDetail.createdAt && (
                          <span><strong>Fecha:</strong> {format(new Date(receivedDetail.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</span>
                        )}
                      </div>
                      <div className="rounded-lg border border-[#e8eaed] overflow-hidden">
                        <ScrollArea className="w-full max-h-[60vh]">
                          <pre className="p-4 text-xs text-[#3b3a3e] font-mono whitespace-pre-wrap break-all bg-[#f8f9fa]">
                            {receivedDetail.content != null
                              ? JSON.stringify(receivedDetail.content, null, 2)
                              : '{}'}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#6b6a6e] text-sm py-6">No se pudo cargar el detalle.</p>
                  )}
                </div>
              ) : receivedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#55c3c5]" />
                </div>
              ) : applicationsReceived.length === 0 ? (
                <p className="text-[#6b6a6e] text-sm py-6 text-center">No hay registros con los filtros aplicados.</p>
              ) : (
                <div className="rounded-lg border border-[#e8eaed] overflow-hidden">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#f8f9fa] border-b border-[#e8eaed]">
                          <TableHead className="text-[#3b3a3e] font-medium">ID</TableHead>
                          <TableHead className="text-[#3b3a3e] font-medium">Fecha</TableHead>
                          <TableHead className="text-[#3b3a3e] font-medium">Detalle</TableHead>
                          <TableHead className="text-[#3b3a3e] font-medium">Estado</TableHead>
                          <TableHead className="text-[#3b3a3e] font-medium text-right">Ver JSON</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applicationsReceived.map((entry) => (
                          <TableRow
                            key={entry.id}
                            className="border-b border-[#e8eaed] hover:bg-[#f8f9fa] cursor-pointer"
                            onClick={() => handleSelectReceived(entry.id)}
                          >
                            <TableCell className="text-[#3b3a3e] font-mono text-sm">{entry.id}</TableCell>
                            <TableCell className="text-[#6b6a6e] text-sm">
                              {entry.createdAt ? format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : '—'}
                            </TableCell>
                            <TableCell className="text-[#6b6a6e] text-sm max-w-[200px] truncate">{entry.detail ?? '—'}</TableCell>
                            <TableCell className="text-[#6b6a6e] text-sm">{entry.status ?? '—'}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#55c3c5] text-[#55c3c5] hover:bg-[#55c3c5]/10"
                                onClick={() => handleSelectReceived(entry.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver JSON
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
