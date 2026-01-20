import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Plus, ListTodo, Clock, AlertTriangle, CheckCircle2, ArrowRight, FileText, History, Rocket } from 'lucide-react';

interface FormField {
  id: string;
  nombre: string;
  tipo: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'file' | 'textarea';
  requerido: boolean;
  placeholder?: string;
  opciones?: string[];
}

interface TipoTarea {
  id: string;
  nombre: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  duracionEstimada: number;
  color: string;
  activo: boolean;
  formulario?: FormField[];
  historico: boolean;
  sincronizarProduccion: boolean;
}

const mockTareas: TipoTarea[] = [
  {
    id: '1',
    nombre: 'Verificación de Documentos',
    descripcion: 'Revisar y validar todos los documentos del cliente',
    prioridad: 'alta',
    duracionEstimada: 2,
    color: 'blue',
    activo: true,
    formulario: [
      { id: 'f1', nombre: 'Documento de Identidad', tipo: 'file', requerido: true, placeholder: 'Subir DNI o Pasaporte' },
      { id: 'f2', nombre: 'Comprobante de Domicilio', tipo: 'file', requerido: true, placeholder: 'Subir comprobante' },
    ],
    historico: true,
    sincronizarProduccion: false,
  },
  {
    id: '2',
    nombre: 'Análisis Crediticio',
    descripcion: 'Evaluar el historial crediticio y capacidad de pago',
    prioridad: 'alta',
    duracionEstimada: 4,
    color: 'red',
    activo: true,
    formulario: [
      { id: 'f3', nombre: 'Score Crediticio', tipo: 'number', requerido: true, placeholder: 'Ingrese score' },
      { id: 'f4', nombre: 'Observaciones', tipo: 'textarea', requerido: false, placeholder: 'Comentarios adicionales' },
    ],
    historico: false,
    sincronizarProduccion: true,
  },
  {
    id: '3',
    nombre: 'Evaluación de Garantías',
    descripcion: 'Verificar y validar las garantías ofrecidas',
    prioridad: 'media',
    duracionEstimada: 3,
    color: 'green',
    activo: true,
    formulario: [],
    historico: true,
    sincronizarProduccion: false,
  },
  {
    id: '4',
    nombre: 'Verificación de Ingresos',
    descripcion: 'Validar los ingresos declarados por el cliente',
    prioridad: 'alta',
    duracionEstimada: 2,
    color: 'purple',
    activo: false,
    formulario: [],
    historico: false,
    sincronizarProduccion: false,
  },
];

const prioridadConfig = {
  baja: { 
    label: 'Baja', 
    color: 'bg-[#f8f9fa] text-[#6b6a6e] border-[#e8eaed]',
    icon: CheckCircle2,
    iconColor: 'text-[#9b9a9e]'
  },
  media: { 
    label: 'Media', 
    color: 'bg-[#55c3c5]/10 text-[#55c3c5] border-[#55c3c5]/20',
    icon: AlertTriangle,
    iconColor: 'text-[#55c3c5]'
  },
  alta: { 
    label: 'Alta', 
    color: 'bg-[#3b3a3e]/10 text-[#3b3a3e] border-[#3b3a3e]/20',
    icon: Clock,
    iconColor: 'text-[#3b3a3e]'
  },
};

const colorConfig = {
  blue: { bg: 'bg-[#55c3c5]', light: 'bg-[#55c3c5]/10' },
  green: { bg: 'bg-[#55c3c5]', light: 'bg-[#55c3c5]/10' },
  red: { bg: 'bg-[#3b3a3e]', light: 'bg-[#3b3a3e]/10' },
  purple: { bg: 'bg-[#6b6a6e]', light: 'bg-[#6b6a6e]/10' },
  orange: { bg: 'bg-[#55c3c5]', light: 'bg-[#55c3c5]/10' },
};

interface TareasListaProps {
  onSelectTarea: (tareaId: string) => void;
  onCreateTarea: () => void;
}

export function TareasLista({ onSelectTarea, onCreateTarea }: TareasListaProps) {
  const [tareas] = useState<TipoTarea[]>(mockTareas);

  const stats = [
    { label: 'Total Tareas', value: tareas.length, icon: ListTodo, color: '#55c3c5', bgColor: 'bg-[#55c3c5]/10' },
    { label: 'Activas', value: tareas.filter(t => t.activo).length, icon: CheckCircle2, color: '#55c3c5', bgColor: 'bg-[#55c3c5]/10' },
    { label: 'Alta Prioridad', value: tareas.filter(t => t.prioridad === 'alta').length, icon: AlertTriangle, color: '#3b3a3e', bgColor: 'bg-[#3b3a3e]/10' },
    { label: 'Duración Promedio', value: `${(tareas.reduce((acc, t) => acc + t.duracionEstimada, 0) / tareas.length).toFixed(1)}h`, icon: Clock, color: '#6b6a6e', bgColor: 'bg-[#6b6a6e]/10' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 md:space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl text-[#3b3a3e] mb-2 tracking-tight font-semibold">Tareas</h1>
          <p className="text-[#6b6a6e] text-base">
            Gestión de tipos de tareas del sistema
          </p>
        </div>
        <Button 
          onClick={onCreateTarea}
          className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-xl shadow-lg shadow-[#55c3c5]/20 h-12 px-8 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nueva Tarea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border border-[#e8eaed] hover:border-[#55c3c5]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#55c3c5]/5 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{ background: `radial-gradient(circle at top right, ${stat.color}, transparent)` }}></div>
              <CardContent className="p-7 md:p-8 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 md:h-7 md:w-7" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-semibold text-[#3b3a3e] mb-3 tracking-tight">{stat.value}</div>
                <p className="text-sm md:text-base text-[#6b6a6e] font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Table */}
      <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
        <CardHeader className="border-b border-[#e8eaed] pb-6 px-6 md:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#55c3c5]/10">
              <ListTodo className="h-6 w-6 text-[#55c3c5]" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl text-[#3b3a3e] tracking-tight">Tareas Configuradas</CardTitle>
              <p className="text-sm text-[#6b6a6e] mt-1">{tareas.length} tareas registradas</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Vista de tabla para pantallas grandes */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8f9fa] hover:bg-[#f8f9fa]">
                  <TableHead className="font-semibold text-[#3b3a3e] py-4 px-6 text-sm">Tarea</TableHead>
                  <TableHead className="font-semibold text-[#3b3a3e] py-4 px-4 text-sm">Prioridad</TableHead>
                  <TableHead className="font-semibold text-[#3b3a3e] py-4 px-4 text-sm">Formulario</TableHead>
                  <TableHead className="font-semibold text-[#3b3a3e] py-4 px-4 text-sm">Histórico</TableHead>
                  <TableHead className="font-semibold text-[#3b3a3e] py-4 px-4 text-sm">Producción</TableHead>
                  <TableHead className="font-semibold text-[#3b3a3e] py-4 px-4 text-sm">Estado</TableHead>
                  <TableHead className="text-right font-semibold text-[#3b3a3e] py-4 px-6 text-sm">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tareas.map((tarea) => {
                  const prioridadInfo = prioridadConfig[tarea.prioridad];
                  const IconPrioridad = prioridadInfo.icon;
                  const colorInfo = colorConfig[tarea.color as keyof typeof colorConfig];
                  
                  return (
                    <TableRow key={tarea.id} className="hover:bg-[#f8f9fa]/50 transition-colors border-b border-[#e8eaed] last:border-0">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${colorInfo.bg} flex-shrink-0`}></div>
                          <div className="max-w-md">
                            <p className="font-medium text-[#3b3a3e] mb-0.5 text-sm">{tarea.nombre}</p>
                            <p className="text-xs text-[#6b6a6e]">{tarea.descripcion}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge className={`${prioridadInfo.color} border font-medium px-2.5 py-1 flex items-center gap-1.5 w-fit text-xs`} variant="secondary">
                          <IconPrioridad className={`h-3 w-3 ${prioridadInfo.iconColor}`} />
                          {prioridadInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        {tarea.formulario && tarea.formulario.length > 0 ? (
                          <Badge className="bg-[#55c3c5]/10 text-[#55c3c5] border-[#55c3c5]/20 px-2.5 py-1 text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {tarea.formulario.length} campos
                          </Badge>
                        ) : (
                          <span className="text-xs text-[#9b9a9e]">Sin formulario</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        {tarea.historico ? (
                          <Badge className="bg-[#6b6a6e]/10 text-[#6b6a6e] border-[#6b6a6e]/20 px-2.5 py-1 text-xs">
                            <History className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <span className="text-xs text-[#9b9a9e]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        {tarea.sincronizarProduccion ? (
                          <Badge className="bg-[#55c3c5]/10 text-[#55c3c5] border-[#55c3c5]/20 px-2.5 py-1 text-xs">
                            <Rocket className="h-3 w-3 mr-1" />
                            Sincronizado
                          </Badge>
                        ) : (
                          <span className="text-xs text-[#9b9a9e]">Solo desarrollo</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge className={tarea.activo ? 'bg-[#55c3c5]/10 text-[#55c3c5] border-[#55c3c5]/20 px-2.5 py-1 text-xs' : 'bg-[#f8f9fa] text-[#9b9a9e] border-[#e8eaed] px-2.5 py-1 text-xs'}>
                          {tarea.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectTarea(tarea.id)}
                          className="hover:bg-[#55c3c5]/10 hover:text-[#55c3c5] rounded-lg group h-8 px-3 text-xs"
                        >
                          Ver Detalles
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Vista de cards para móvil y tablet */}
          <div className="lg:hidden space-y-4 p-5 md:p-6">
            {tareas.map((tarea) => {
              const prioridadInfo = prioridadConfig[tarea.prioridad];
              const IconPrioridad = prioridadInfo.icon;
              const colorInfo = colorConfig[tarea.color as keyof typeof colorConfig];
              
              return (
                <Card 
                  key={tarea.id} 
                  className="border border-[#e8eaed] hover:border-[#55c3c5]/50 transition-all duration-200 hover:shadow-lg hover:shadow-[#55c3c5]/5 cursor-pointer"
                  onClick={() => onSelectTarea(tarea.id)}
                >
                  <CardContent className="p-5 md:p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <div className={`w-4 h-4 rounded-full ${colorInfo.bg} flex-shrink-0 mt-1`}></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#3b3a3e] mb-1.5 text-base">{tarea.nombre}</h3>
                        <p className="text-sm text-[#6b6a6e] leading-relaxed">{tarea.descripcion}</p>
                      </div>
                    </div>

                    {/* Badges Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[#9b9a9e] mb-2 font-medium">Prioridad</p>
                        <Badge className={`${prioridadInfo.color} border font-medium px-3 py-2 flex items-center gap-2 w-fit`} variant="secondary">
                          <IconPrioridad className={`h-3.5 w-3.5 ${prioridadInfo.iconColor}`} />
                          {prioridadInfo.label}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-xs text-[#9b9a9e] mb-2 font-medium">Estado</p>
                        <Badge className={tarea.activo ? 'bg-[#55c3c5]/10 text-[#55c3c5] border-[#55c3c5]/20 px-3 py-2' : 'bg-[#f8f9fa] text-[#9b9a9e] border-[#e8eaed] px-3 py-2'}>
                          {tarea.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-[#e8eaed]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#9b9a9e]" />
                        <span className="text-sm text-[#6b6a6e]">
                          {tarea.formulario && tarea.formulario.length > 0 
                            ? `${tarea.formulario.length} campos` 
                            : 'Sin formulario'}
                        </span>
                      </div>
                      
                      {tarea.historico && (
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-[#6b6a6e]" />
                          <span className="text-sm text-[#6b6a6e]">Histórico</span>
                        </div>
                      )}
                      
                      {tarea.sincronizarProduccion && (
                        <div className="flex items-center gap-2">
                          <Rocket className="h-4 w-4 text-[#55c3c5]" />
                          <span className="text-sm text-[#55c3c5]">Sincronizado</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="ghost"
                      className="w-full bg-[#55c3c5]/5 hover:bg-[#55c3c5]/10 hover:text-[#55c3c5] text-[#55c3c5] rounded-lg group h-11"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTarea(tarea.id);
                      }}
                    >
                      Ver Detalles
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}