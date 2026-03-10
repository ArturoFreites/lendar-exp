import React, { useState, useEffect, useRef } from 'react';
import { useMigratedPerson } from '../../hooks/use-migrated-person';
import type { MigratedPersonResponse } from '../../types/dto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { TablePagination } from '../ui/table-pagination';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Search, UserCheck, FileText, RefreshCw, Users, ArrowLeft, ChevronRight, Upload, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PAGE_SIZE = 10;

const SAMPLE_CSV =
  'Pr\u00E9stamo,Solicitante nombre,Solicitante apellido,Solicitante DNI,Solicitante email,Inversor nombre,Inversor apellido,Inversor DNI,Inversor email\n#12345,Juan,P\u00E9rez,30123456,juan.perez@ejemplo.com,Mar\u00EDa,Garc\u00EDa,31234567,maria.garcia@ejemplo.com\n67890,Carlos,L\u00F3pez,32345678,carlos.lopez@ejemplo.com,Ana,Mart\u00EDnez,33456789,ana.martinez@ejemplo.com';

type SelectedSubmodule = null | 'usuarios-migrados';

export function Migracion() {
  const migratedApi = useMigratedPerson();
  const [selectedSubmodule, setSelectedSubmodule] = useState<SelectedSubmodule>(null);
  const [items, setItems] = useState<MigratedPersonResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = async (page: number = 0, searchTerm?: string) => {
    if (!migratedApi.hasApi) {
      toast.error('No hay servicio de API disponible');
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        size: PAGE_SIZE.toString(),
      };
      if (searchTerm && searchTerm.trim()) {
        params.orContains = `name,lastName,email,dni:${searchTerm.trim()}`;
      }

      const response = await migratedApi.getMigratedPersons(params);
      if (response?.code === 200 && response.data) {
        const list = response.data.content ?? [];
        setItems(list);
        setTotalPages(response.data.totalPages ?? 0);
        setTotalElements(response.data.totalElements ?? 0);
        setCurrentPage(response.data.number ?? 0);
        if (list.length === 0 && searchTerm) {
          toast.info('No se encontraron usuarios migrados con ese criterio de búsqueda');
        }
      } else {
        toast.error(response?.message ?? 'Error al cargar usuarios migrados');
        setItems([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar usuarios migrados');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubmodule === 'usuarios-migrados') {
      load(0, search);
    }
  }, [selectedSubmodule]);

  const handleSearch = () => {
    setCurrentPage(0);
    load(0, search);
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(0);
    load(0);
  };

  const downloadSampleCsv = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios-migrados-ejemplo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !migratedApi.hasApi) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('El archivo debe ser un CSV (.csv)');
      return;
    }
    setImporting(true);
    try {
      const response = await migratedApi.importMigratedPersonsCsv(selectedFile);
      if (response?.code === 200 || response?.code === 201) {
        const rows = response.data ?? 0;
        toast.success(response.message || `Importación completada. ${rows} fila${rows !== 1 ? 's' : ''} procesada${rows !== 1 ? 's' : ''}.`);
        setImportModalOpen(false);
        setSelectedFile(null);
        load(currentPage, search);
      } else {
        toast.error(response?.message ?? 'Error al importar el CSV');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al importar el CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelectInModal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) setSelectedFile(file);
  };

  const handleDropInModal = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) setSelectedFile(file);
    else if (file) toast.error('El archivo debe ser un CSV (.csv)');
  };

  const handleDragOverInModal = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBackToCards = () => {
    setSelectedSubmodule(null);
  };

  if (selectedSubmodule === 'usuarios-migrados') {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToCards}
            className="gap-2 border-[#e5e5e6] text-[#6b6a6e] hover:bg-[#f5f5f6]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#3b3a3e]">Usuarios migrados</h1>
            <p className="text-[#6b6a6e] text-sm mt-0.5">Listado, búsqueda y detalles</p>
          </div>
        </div>

        <Card className="border border-[#e5e5e6] shadow-sm">
          <CardHeader className="pb-4 border-b border-[#e5e5e6]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl text-[#3b3a3e]">
                  <UserCheck className="h-5 w-5 text-[#55c3c5]" />
                  Usuarios migrados
                </CardTitle>
                <CardDescription className="text-[#6b6a6e] mt-1">
                  Busca y revisa el listado de personas migradas. Filtra por nombre, apellido, email o DNI.
                </CardDescription>
                <p className="text-sm text-[#6b6a6e] mt-2">
                  {totalElements} usuario{totalElements !== 1 ? 's' : ''} migrado
                  {totalElements !== 1 ? 's' : ''} encontrado{totalElements !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 flex flex-wrap gap-2">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6a6e] pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, apellido, email o DNI..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 h-10 border-[#e5e5e6] text-[#3b3a3e] placeholder:text-[#9b9a9e] focus-visible:ring-[#55c3c5]"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                aria-hidden
                onChange={handleFileSelectInModal}
              />
              <Button
                onClick={() => setImportModalOpen(true)}
                disabled={loading || !migratedApi.hasApi}
                variant="outline"
                className="h-10 gap-2 border-[#e5e5e6] text-[#6b6a6e] hover:bg-[#f5f5f6]"
              >
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-10 gap-2 bg-[#55c3c5] hover:bg-[#4ab3b5] text-white border-0"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Buscando…' : 'Buscar'}
              </Button>
              <Button
                onClick={() => load(currentPage)}
                variant="outline"
                size="icon"
                disabled={loading}
                title="Actualizar"
                className="h-10 w-10 border-[#e5e5e6] text-[#6b6a6e] hover:bg-[#f5f5f6]"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {search && (
                <Button
                  onClick={handleClearSearch}
                  variant="outline"
                  disabled={loading}
                  className="h-10 border-[#e5e5e6] text-[#6b6a6e] hover:bg-[#f5f5f6]"
                >
                  Limpiar
                </Button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12 text-[#6b6a6e] text-sm">Cargando…</div>
            ) : items.length === 0 && !search ? (
              <div className="text-center py-12 text-[#6b6a6e] text-sm">
                No hay usuarios migrados. Usa el buscador para filtrar.
              </div>
            ) : items.length === 0 && search ? (
              <div className="text-center py-12 text-[#6b6a6e] text-sm">
                No se encontraron usuarios migrados con ese criterio de búsqueda.
              </div>
            ) : (
              <>
                <ScrollArea className="h-[520px] pr-2">
                  <div className="space-y-4">
                    {items.map((person) => (
                      <Card
                        key={person.id}
                        className="border border-[#e5e5e6] border-l-4 border-l-[#55c3c5] shadow-sm overflow-hidden"
                      >
                        <CardContent className="p-0">
                          <div className="p-5">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#55c3c5]/10">
                                <UserCheck className="h-5 w-5 text-[#55c3c5]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-[#3b3a3e] text-base leading-tight">
                                  {person.name} {person.lastName}
                                </h3>
                                <p className="text-sm text-[#6b6a6e] mt-0.5 truncate">
                                  {person.email}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 shrink-0">
                                {person.isApplication === true && (
                                  <Badge
                                    variant="outline"
                                    className="bg-[#55c3c5]/10 text-[#3b3a3e] border-[#55c3c5]/30"
                                  >
                                    Solicitud
                                  </Badge>
                                )}
                                {person.isInvestment === true && (
                                  <Badge
                                    variant="outline"
                                    className="bg-[#55c3c5]/10 text-[#3b3a3e] border-[#55c3c5]/30"
                                  >
                                    Inversión
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-[#e5e5e6]">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-[#6b6a6e] shrink-0">DNI:</span>
                                <span className="text-[#3b3a3e] font-medium">{person.dni}</span>
                              </div>
                              {person.applicationNumber && (
                                <div className="flex items-center gap-2 text-sm">
                                  <FileText className="h-4 w-4 text-[#6b6a6e] shrink-0" />
                                  <span className="text-[#6b6a6e] shrink-0">Expediente:</span>
                                  <span className="text-[#3b3a3e]">{person.applicationNumber}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-xs text-[#9b9a9e]">
                              <span>Actualizado: {format(new Date(person.updatedAt), 'PP p', { locale: es })}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {totalPages > 1 && (
                  <div className="mt-5 pt-5 border-t border-[#e5e5e6]">
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(p) => load(p, search)}
                      disabled={loading}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={importModalOpen} onOpenChange={(open) => { setImportModalOpen(open); if (!open) setSelectedFile(null); }}>
          <DialogContent className="sm:max-w-md text-[#3b3a3e] border-[#e5e5e6]">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#3b3a3e]">Importar usuarios migrados</DialogTitle>
              <DialogDescription className="text-[#6b6a6e] text-left">
                Sube un archivo CSV con el listado de solicitantes e inversores. La primera fila debe ser la cabecera. Cada fila puede incluir datos de solicitante (columnas 1-4) y/o inversor (columnas 5-8). Se requiere DNI o email por persona.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Button
                type="button"
                variant="outline"
                onClick={downloadSampleCsv}
                className="w-full gap-2 border-[#e5e5e6] text-[#6b6a6e] hover:bg-[#f5f5f6]"
              >
                <FileDown className="h-4 w-4" />
                Descargar archivo de ejemplo
              </Button>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDropInModal}
                onDragOver={handleDragOverInModal}
                className="border-2 border-dashed border-[#e5e5e6] rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[#55c3c5]/60 hover:bg-[#55c3c5]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55c3c5]"
              >
                <Upload className="h-10 w-10 mx-auto text-[#9b9a9e] mb-3" />
                <p className="text-sm font-medium text-[#3b3a3e]">
                  {selectedFile ? selectedFile.name : 'Arrastra aquí tu CSV o haz clic para seleccionar'}
                </p>
                <p className="text-xs text-[#6b6a6e] mt-1">Solo archivos .csv</p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setImportModalOpen(false); setSelectedFile(null); }}
                className="border-[#e5e5e6] text-[#6b6a6e] hover:bg-[#f5f5f6]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!selectedFile || importing}
                onClick={handleConfirmImport}
                className="bg-[#55c3c5] hover:bg-[#4ab3b5] text-white border-0"
              >
                {importing ? 'Importando…' : 'Importar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-[#3b3a3e]">Migración</h1>
        <p className="text-[#6b6a6e] mt-1">
          Elige un submódulo para gestionar los datos migrados
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => setSelectedSubmodule('usuarios-migrados')}
          onKeyDown={(e) => e.key === 'Enter' && setSelectedSubmodule('usuarios-migrados')}
          className="border border-[#e5e5e6] shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#55c3c5]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55c3c5] focus-visible:ring-offset-2"
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#55c3c5]/10">
                <Users className="h-6 w-6 text-[#55c3c5]" />
              </div>
              <ChevronRight className="h-5 w-5 text-[#9b9a9e] shrink-0" />
            </div>
            <CardTitle className="text-lg text-[#3b3a3e] mt-3">
              Usuarios migrados
            </CardTitle>
            <CardDescription className="text-[#6b6a6e] text-sm">
              Listado, búsqueda y detalles de personas migradas. Filtra por nombre, apellido, email o DNI.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-[#9b9a9e]">
              Haz clic para abrir el listado
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
