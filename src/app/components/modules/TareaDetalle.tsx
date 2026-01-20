import React, { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ArrowLeft, Save, FileText, History, Zap, Settings, Plus, X, Grip, Edit2, Trash2, Eye, ChevronDown, ChevronRight, GitBranch, ArrowDown, ChevronUp, MoveUp, MoveDown, Check, Type, List, CheckSquare, FileType, Repeat, Circle, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

interface FormFieldConfig {
  label: string;
  value: any;
  type: string;
  placeholder?: string;
  isRequired: boolean;
  errorMessage: string;
  options?: string[];
}

interface FormField {
  id: number;
  name: string;
  type: string;
  component: 'input' | 'dropdown' | 'checkbox' | 'notes' | 'dropdown-state';
  field: FormFieldConfig;
}

interface Action {
  name: string;
  dependencies: string[];
}

interface StatusConfig {
  status: string;
  subStatusList: {
    subStatus: string;
    reasons: string[];
  }[];
}

interface FormVersion {
  version: number;
  date: string;
  user: string;
  taskTypeId: number;
  actions: Action[];
  formFields: FormField[];
  statusConfig: StatusConfig[];
  changes: string;
}

interface TipoTarea {
  id: string;
  nombre: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  duracionEstimada: number;
  color: string;
  activo: boolean;
  taskTypeId: number;
  actions: Action[];
  formFields: FormField[];
  statusConfig: StatusConfig[];
  historico: FormVersion[];
}

const mockFormFields: FormField[] = [
  {
    id: 10,
    name: "email",
    type: "string",
    component: "input",
    field: {
      label: "E-mail (Obligatorio)",
      value: null,
      type: "email",
      placeholder: "Email",
      isRequired: true,
      errorMessage: "Seleccione un e-mail"
    }
  },
  {
    id: 1,
    name: "operationType",
    type: "string[]",
    component: "dropdown",
    field: {
      label: "Tipo de Operación (Obligatorio)",
      options: ["Compra-venta", "Hipoteca"],
      value: null,
      type: "text",
      placeholder: "Tipo de Operacion",
      isRequired: true,
      errorMessage: "Seleccione un tipo de Operacion"
    }
  },
  {
    id: 2,
    name: "remaxPropertyBuy",
    type: "boolean",
    component: "checkbox",
    field: {
      label: "¿El cliente compra una propiedad con RE/MAX?",
      value: null,
      type: "boolean",
      isRequired: false,
      errorMessage: "Seleccione si es una propiedad con RE/MAX"
    }
  }
];

const mockStatusConfig: StatusConfig[] = [
  {
    status: "Pendiente",
    subStatusList: []
  },
  {
    status: "En Proceso",
    subStatusList: [
      { subStatus: "Primer intento", reasons: [] },
      { subStatus: "Segundo Intento", reasons: [] }
    ]
  },
  {
    status: "Aprobado",
    subStatusList: [
      { subStatus: "Con reserva", reasons: [] },
      { subStatus: "Sin reserva", reasons: [] }
    ]
  },
  {
    status: "Rechazado",
    subStatusList: [
      {
        subStatus: "Por Lendar",
        reasons: ["No tiene Cuenta U$S", "Veraz incobrable", "Ing. insuficientes"]
      },
      {
        subStatus: "Por el cliente",
        reasons: ["Ingresada por Error", "Desistio comprador"]
      }
    ]
  }
];

const mockTarea: TipoTarea = {
  id: '1',
  nombre: 'Verificación de Documentos',
  descripcion: 'Revisar y validar todos los documentos del cliente',
  prioridad: 'alta',
  duracionEstimada: 2,
  color: 'blue',
  activo: true,
  taskTypeId: 4,
  actions: [
    { name: "actualizar-tarea", dependencies: [] },
    { name: "cargar-email-solicitante", dependencies: ["actualizar-tarea"] },
    { name: "validar-documentos", dependencies: ["cargar-email-solicitante"] }
  ],
  formFields: mockFormFields,
  statusConfig: mockStatusConfig,
  historico: [
    {
      version: 2,
      date: '2024-01-15 14:30',
      user: 'Juan Pérez',
      taskTypeId: 4,
      actions: [{ name: "actualizar-tarea", dependencies: [] }],
      formFields: mockFormFields.slice(0, 2),
      statusConfig: mockStatusConfig.slice(0, 2),
      changes: 'Se agregó campo de email y se modificó la configuración de estados'
    },
    {
      version: 1,
      date: '2024-01-10 10:15',
      user: 'María González',
      taskTypeId: 4,
      actions: [{ name: "actualizar-tarea", dependencies: [] }],
      formFields: mockFormFields.slice(0, 1),
      statusConfig: mockStatusConfig.slice(0, 1),
      changes: 'Versión inicial del formulario'
    }
  ]
};

const componentOptions = [
  { value: 'input', label: 'Input', iconComponent: Type },
  { value: 'dropdown', label: 'Dropdown', iconComponent: List },
  { value: 'checkbox', label: 'Checkbox', iconComponent: CheckSquare },
  { value: 'notes', label: 'Notes', iconComponent: FileType },
  { value: 'dropdown-state', label: 'Dropdown State', iconComponent: Repeat },
];

const typeOptions = ['string', 'string[]', 'boolean', 'number', 'text'];
const fieldTypeOptions = ['text', 'email', 'number', 'boolean', 'date', 'tel', 'url'];

interface TareaDetalleProps {
  tareaId: string;
  onBack: () => void;
}

export function TareaDetalle({ tareaId, onBack }: TareaDetalleProps) {
  const [activeTab, setActiveTab] = useState('formulario');
  const [tarea, setTarea] = useState<TipoTarea>(mockTarea);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<FormVersion | null>(null);
  const [editingStatus, setEditingStatus] = useState<StatusConfig | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  // Estado para nueva acción
  const [newAction, setNewAction] = useState({ name: '', dependencies: [] as string[] });
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [isCreatingNewAction, setIsCreatingNewAction] = useState(false);
  const [customActionName, setCustomActionName] = useState('');
  
  // Lista de acciones disponibles (se irán agregando al crear nuevas)
  const [availableActions, setAvailableActions] = useState<string[]>([
    'actualizar-tarea',
    'cargar-email-solicitante',
    'validar-documentos',
    'enviar-notificacion',
    'generar-reporte',
    'procesar-pago',
    'verificar-identidad',
    'aprobar-solicitud',
  ]);

  // Estados para formulario
  const [searchField, setSearchField] = useState('');

  const currentVersion = tarea.historico.length + 1;

  // Filtrar campos según búsqueda
  const filteredFields = tarea.formFields.filter(field => 
    field.name.toLowerCase().includes(searchField.toLowerCase()) ||
    field.field.label.toLowerCase().includes(searchField.toLowerCase()) ||
    field.component.toLowerCase().includes(searchField.toLowerCase())
  );

  // Función para mover campos
  const moveField = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    
    const newFields = [...tarea.formFields];
    const [draggedField] = newFields.splice(dragIndex, 1);
    newFields.splice(hoverIndex, 0, draggedField);
    
    setTarea({ ...tarea, formFields: newFields });
  };

  const handleOpenFieldDialog = (field?: FormField) => {
    if (field) {
      setEditingField({ ...field });
    } else {
      setEditingField({
        id: Math.max(...tarea.formFields.map(f => f.id), 0) + 1,
        name: '',
        type: 'string',
        component: 'input',
        field: {
          label: '',
          value: null,
          type: 'text',
          placeholder: '',
          isRequired: false,
          errorMessage: '',
          options: []
        }
      });
    }
    setIsFieldDialogOpen(true);
  };

  const handleSaveField = () => {
    if (!editingField) return;

    const existingIndex = tarea.formFields.findIndex(f => f.id === editingField.id);
    if (existingIndex >= 0) {
      const updated = [...tarea.formFields];
      updated[existingIndex] = editingField;
      setTarea({ ...tarea, formFields: updated });
      toast.success('Campo actualizado');
    } else {
      setTarea({ ...tarea, formFields: [...tarea.formFields, editingField] });
      toast.success('Campo agregado');
    }
    setIsFieldDialogOpen(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: number) => {
    setTarea({
      ...tarea,
      formFields: tarea.formFields.filter(f => f.id !== fieldId)
    });
    toast.success('Campo eliminado');
  };

  const handleAddAction = () => {
    const actionName = isCreatingNewAction ? customActionName : newAction.name;
    
    if (actionName) {
      // La nueva acción depende de la última acción en la lista
      const dependencies = tarea.actions.length > 0 
        ? [tarea.actions[tarea.actions.length - 1].name] 
        : [];
      
      setTarea({
        ...tarea,
        actions: [...tarea.actions, { name: actionName, dependencies }]
      });
      
      // Si es una acción nueva personalizada, agregarla a la lista
      if (isCreatingNewAction && !availableActions.includes(actionName)) {
        setAvailableActions([...availableActions, actionName]);
      }
      
      setNewAction({ name: '', dependencies: [] });
      setCustomActionName('');
      setIsAddingAction(false);
      setIsCreatingNewAction(false);
      toast.success('Acción agregada al flujo');
    }
  };

  const handleDeleteAction = (actionName: string) => {
    const actionIndex = tarea.actions.findIndex(a => a.name === actionName);
    const updatedActions = tarea.actions.filter(a => a.name !== actionName);
    
    // Reajustar dependencias para mantener la cadena
    const reajustedActions = updatedActions.map((action, index) => {
      if (index === 0) {
        return { ...action, dependencies: [] };
      } else {
        return { ...action, dependencies: [updatedActions[index - 1].name] };
      }
    });
    
    setTarea({
      ...tarea,
      actions: reajustedActions
    });
    toast.success('Acción eliminada del flujo');
  };

  const handleMoveActionUp = (index: number) => {
    if (index === 0) return;
    
    const newActions = [...tarea.actions];
    [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
    
    // Reajustar dependencias
    const reajustedActions = newActions.map((action, idx) => {
      if (idx === 0) {
        return { ...action, dependencies: [] };
      } else {
        return { ...action, dependencies: [newActions[idx - 1].name] };
      }
    });
    
    setTarea({ ...tarea, actions: reajustedActions });
    toast.success('Acción movida hacia arriba');
  };

  const handleMoveActionDown = (index: number) => {
    if (index === tarea.actions.length - 1) return;
    
    const newActions = [...tarea.actions];
    [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
    
    // Reajustar dependencias
    const reajustedActions = newActions.map((action, idx) => {
      if (idx === 0) {
        return { ...action, dependencies: [] };
      } else {
        return { ...action, dependencies: [newActions[idx - 1].name] };
      }
    });
    
    setTarea({ ...tarea, actions: reajustedActions });
    toast.success('Acción movida hacia abajo');
  };

  const handleOpenStatusDialog = (status?: StatusConfig) => {
    if (status) {
      setEditingStatus({ ...status, subStatusList: [...status.subStatusList.map(s => ({ ...s, reasons: [...s.reasons] }))] });
    } else {
      setEditingStatus({ status: '', subStatusList: [] });
    }
    setIsStatusDialogOpen(true);
  };

  const handleSaveStatus = () => {
    if (!editingStatus) return;

    const existingIndex = tarea.statusConfig.findIndex(s => s.status === editingStatus.status);
    if (existingIndex >= 0) {
      const updated = [...tarea.statusConfig];
      updated[existingIndex] = editingStatus;
      setTarea({ ...tarea, statusConfig: updated });
      toast.success('Estado actualizado');
    } else {
      setTarea({ ...tarea, statusConfig: [...tarea.statusConfig, editingStatus] });
      toast.success('Estado agregado');
    }
    setIsStatusDialogOpen(false);
    setEditingStatus(null);
  };

  const handleDeleteStatus = (statusName: string) => {
    setTarea({
      ...tarea,
      statusConfig: tarea.statusConfig.filter(s => s.status !== statusName)
    });
    toast.success('Estado eliminado');
  };

  const handleAddSubStatus = (subStatus: string) => {
    if (!editingStatus) return;
    setEditingStatus({
      ...editingStatus,
      subStatusList: [...editingStatus.subStatusList, { subStatus, reasons: [] }]
    });
  };

  const handleRemoveSubStatus = (subStatusName: string) => {
    if (!editingStatus) return;
    setEditingStatus({
      ...editingStatus,
      subStatusList: editingStatus.subStatusList.filter(s => s.subStatus !== subStatusName)
    });
  };

  const handleAddReason = (subStatusName: string, reason: string) => {
    if (!editingStatus) return;
    setEditingStatus({
      ...editingStatus,
      subStatusList: editingStatus.subStatusList.map(s => {
        if (s.subStatus === subStatusName) {
          return { ...s, reasons: [...s.reasons, reason] };
        }
        return s;
      })
    });
  };

  const handleRemoveReason = (subStatusName: string, reason: string) => {
    if (!editingStatus) return;
    setEditingStatus({
      ...editingStatus,
      subStatusList: editingStatus.subStatusList.map(s => {
        if (s.subStatus === subStatusName) {
          return { ...s, reasons: s.reasons.filter(r => r !== reason) };
        }
        return s;
      })
    });
  };

  const handleSave = () => {
    const newVersion: FormVersion = {
      version: currentVersion,
      date: new Date().toLocaleString('es-AR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      user: 'Usuario Actual',
      taskTypeId: tarea.taskTypeId,
      actions: [...tarea.actions],
      formFields: [...tarea.formFields],
      statusConfig: [...tarea.statusConfig],
      changes: 'Cambios guardados manualmente'
    };

    setTarea({
      ...tarea,
      historico: [newVersion, ...tarea.historico]
    });

    toast.success('Cambios guardados - Nueva versión creada');
  };

  const handleToggleActivo = () => {
    setTarea({ ...tarea, activo: !tarea.activo });
    toast.success(tarea.activo ? 'Tarea desactivada' : 'Tarea activada');
  };

  const handleViewVersion = (version: FormVersion) => {
    setViewingVersion(version);
  };

  const handleRestoreVersion = (version: FormVersion) => {
    setTarea({
      ...tarea,
      actions: [...version.actions],
      formFields: [...version.formFields],
      statusConfig: [...version.statusConfig]
    });
    setViewingVersion(null);
    toast.success('Versión restaurada. Guarda los cambios para confirmar.');
  };

  const getComponentIcon = (component: string) => {
    const ComponentIcon = componentOptions.find(c => c.value === component)?.iconComponent || Type;
    return ComponentIcon;
  };

  // Componente Field Card Arrastrable
  interface DraggableFieldCardProps {
    field: FormField;
    index: number;
    moveField: (dragIndex: number, hoverIndex: number) => void;
    onEdit: (field: FormField) => void;
    onDelete: (id: string) => void;
    isDragDisabled?: boolean;
  }

  const DraggableFieldCard: React.FC<DraggableFieldCardProps> = ({ field, index, moveField, onEdit, onDelete, isDragDisabled = false }) => {
    const ref = useRef<HTMLDivElement>(null);

    const [{ handlerId }, drop] = useDrop({
      accept: 'field-card',
      canDrop: () => !isDragDisabled,
      collect(monitor) {
        return {
          handlerId: monitor.getHandlerId(),
        };
      },
      drop(item: { index: number; id: string }) {
        if (!isDragDisabled && item.index !== index) {
          toast.success('Campo reordenado');
        }
      },
      hover(item: { index: number; id: string }, monitor) {
        if (!ref.current || isDragDisabled) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;

        if (dragIndex === hoverIndex) {
          return;
        }

        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        
        if (!clientOffset) {
          return;
        }
        
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }

        moveField(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    });

    const [{ isDragging }, drag] = useDrag({
      type: 'field-card',
      item: () => {
        return { id: field.id, index };
      },
      canDrag: () => !isDragDisabled,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    if (!isDragDisabled) {
      drag(drop(ref));
    }

    const IconComponent = getComponentIcon(field.component);

    return (
      <div
        ref={ref}
        data-handler-id={handlerId}
        className={`group relative p-4 bg-white rounded-lg border border-[#e8eaed] hover:border-[#55c3c5] hover:shadow-sm transition-all ${
          !isDragDisabled ? 'cursor-move' : 'cursor-default'
        } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      >
        {/* Número de orden */}
        <div className="absolute top-3 left-3 w-5 h-5 rounded bg-[#f8f9fa] flex items-center justify-center">
          <span className="text-xs font-medium text-[#6b6a6e]">{index + 1}</span>
        </div>

        {/* Acciones */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(field)}
            className="h-6 w-6 p-0 text-[#55c3c5] hover:bg-[#55c3c5]/10 rounded"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(field.id)}
            className="h-6 w-6 p-0 text-[#6b6a6e] hover:text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Contenido */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className="h-4 w-4 text-[#55c3c5] flex-shrink-0" />
            <h4 className="font-semibold text-[#3b3a3e] text-sm truncate">{field.field.label}</h4>
          </div>
          
          <p className="text-xs text-[#6b6a6e] mb-3 truncate font-mono">{field.name}</p>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-[#f8f9fa] text-[#6b6a6e] rounded">{field.component}</span>
            {field.field.isRequired && (
              <span className="text-[#55c3c5]">• Requerido</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="p-6 space-y-5">
      {/* Header Compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="hover:bg-[#55c3c5]/10 hover:text-[#55c3c5] rounded-lg h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl text-[#3b3a3e] tracking-tight font-semibold">{tarea.nombre}</h1>
              <Badge className={tarea.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs' : 'bg-slate-50 text-slate-700 border-slate-200 text-xs'}>
                {tarea.activo ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge className="bg-gradient-to-r from-[#55c3c5] to-[#3db3b5] text-white border-0 text-xs px-2.5 py-1 shadow-lg shadow-[#55c3c5]/30">
                V{currentVersion}
              </Badge>
            </div>
            <p className="text-[#6b6a6e] text-sm">{tarea.descripcion}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleToggleActivo}
            variant="outline"
            className="border-[#e8eaed] hover:border-[#55c3c5] hover:bg-[#55c3c5]/5 rounded-lg h-9 px-4 text-sm"
          >
            {tarea.activo ? 'Desactivar' : 'Activar'}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-lg shadow-lg shadow-[#55c3c5]/20 h-9 px-4 text-sm"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Tabs Compactos */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border border-[#e8eaed] p-0.5 rounded-lg inline-flex h-9">
          <TabsTrigger
            value="formulario"
            className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-md px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Formulario
            <Badge className="ml-0.5 bg-white/20 text-white text-xs px-1 py-0 h-4 min-w-[1rem] flex items-center justify-center">
              {tarea.formFields.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="acciones"
            className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-md px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5"
          >
            <Zap className="h-3.5 w-3.5" />
            Acciones
            <Badge className="ml-0.5 bg-white/20 text-white text-xs px-1 py-0 h-4 min-w-[1rem] flex items-center justify-center">
              {tarea.actions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="estados"
            className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-md px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" />
            Estados
            <Badge className="ml-0.5 bg-white/20 text-white text-xs px-1 py-0 h-4 min-w-[1rem] flex items-center justify-center">
              {tarea.statusConfig.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-md px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5"
          >
            <History className="h-3.5 w-3.5" />
            Histórico
            <Badge className="ml-0.5 bg-white/20 text-white text-xs px-1 py-0 h-4 min-w-[1rem] flex items-center justify-center">
              {tarea.historico.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab Formulario */}
        <TabsContent value="formulario" className="space-y-4">
          <Card className="border border-[#e8eaed] shadow-sm">
            <CardHeader className="border-b border-[#e8eaed] py-3 px-4 space-y-3">
              {/* Título y botón */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#55c3c5]/10 rounded-md">
                    <FileText className="h-4 w-4 text-[#55c3c5]" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-[#3b3a3e] tracking-tight">Campos del Formulario</CardTitle>
                    <p className="text-xs text-[#6b6a6e] mt-0.5">
                      {filteredFields.length} {filteredFields.length !== tarea.formFields.length && `de ${tarea.formFields.length}`} campo{filteredFields.length !== 1 ? 's' : ''} {searchField && 'encontrado' + (filteredFields.length !== 1 ? 's' : '')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleOpenFieldDialog()}
                  className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-8 px-3 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Nuevo Campo
                </Button>
              </div>

              {/* Barra de herramientas: búsqueda y vista */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6a6e]" />
                  <Input
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    placeholder="Buscar por nombre, etiqueta o tipo..."
                    className="h-9 pl-9 pr-4 border-[#e8eaed] focus:border-[#55c3c5] rounded-md text-sm"
                  />
                  {searchField && (
                    <button
                      onClick={() => setSearchField('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6a6e] hover:text-[#3b3a3e]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {(searchField ? filteredFields : tarea.formFields).length > 0 ? (
                /* Siempre en 2 columnas */
                <div className="grid grid-cols-2 gap-3">
                  {(searchField ? filteredFields : tarea.formFields).map((field, index) => (
                    <DraggableFieldCard
                      key={field.id}
                      field={field}
                      index={index}
                      moveField={moveField}
                      onEdit={handleOpenFieldDialog}
                      onDelete={handleDeleteField}
                      isDragDisabled={!!searchField}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#f8f9fa] rounded-lg border border-dashed border-[#e8eaed]">
                  {searchField ? (
                    <>
                      <Search className="h-10 w-10 text-[#6b6a6e] mx-auto mb-3 opacity-50" />
                      <p className="text-[#3b3a3e] font-medium mb-1">No se encontraron campos</p>
                      <p className="text-[#6b6a6e] text-sm">Intenta con otros términos de búsqueda</p>
                      <Button
                        onClick={() => setSearchField('')}
                        variant="outline"
                        className="mt-4 h-8 text-xs"
                      >
                        Limpiar búsqueda
                      </Button>
                    </>
                  ) : (
                    <>
                      <FileText className="h-10 w-10 text-[#6b6a6e] mx-auto mb-3 opacity-50" />
                      <p className="text-[#3b3a3e] font-medium mb-1">No hay campos en el formulario</p>
                      <p className="text-[#6b6a6e] text-sm mb-4">Agrega campos para comenzar a configurar el formulario</p>
                      <Button
                        onClick={() => handleOpenFieldDialog()}
                        className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white h-8 text-xs"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Agregar Primer Campo
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Acciones */}
        <TabsContent value="acciones" className="space-y-4">
          <Card className="border border-[#e8eaed] shadow-sm">
            <CardHeader className="border-b border-[#e8eaed] py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#55c3c5]/10 rounded-md">
                    <Zap className="h-4 w-4 text-[#55c3c5]" />
                  </div>
                  <CardTitle className="text-sm text-[#3b3a3e] tracking-tight">Acciones y Dependencias</CardTitle>
                </div>
                <Button
                  onClick={() => setIsAddingAction(true)}
                  className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-8 px-3 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Nueva
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {isAddingAction && (
                <div className="mb-4 p-4 bg-gradient-to-br from-[#55c3c5]/5 to-white rounded-lg border border-[#55c3c5]/30 shadow-sm">
                  <div className="space-y-3">
                    {!isCreatingNewAction ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-[#55c3c5]/10 rounded">
                            <Zap className="h-3.5 w-3.5 text-[#55c3c5]" />
                          </div>
                          <Label className="text-sm font-semibold text-[#3b3a3e]">Seleccionar Acción</Label>
                        </div>
                        <Select
                          value={newAction.name}
                          onValueChange={(value) => {
                            if (value === '__crear_nueva__') {
                              setIsCreatingNewAction(true);
                              setNewAction({ name: '', dependencies: [] });
                            } else {
                              setNewAction({ ...newAction, name: value });
                            }
                          }}
                        >
                          <SelectTrigger className="h-10 border-[#e8eaed] focus:border-[#55c3c5] rounded-md">
                            <SelectValue placeholder="Elegir acción existente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableActions.map(action => (
                              <SelectItem key={action} value={action} className="text-sm">
                                {action}
                              </SelectItem>
                            ))}
                            <SelectItem value="__crear_nueva__" className="text-sm font-semibold text-[#55c3c5] border-t mt-1 pt-2">
                              <div className="flex items-center gap-2">
                                <Plus className="h-3 w-3" />
                                <span>Crear nueva acción personalizada</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-amber-500/10 rounded">
                            <Plus className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <Label className="text-sm font-semibold text-[#3b3a3e]">Nueva Acción Personalizada</Label>
                        </div>
                        <Input
                          value={customActionName}
                          onChange={(e) => setCustomActionName(e.target.value)}
                          placeholder="Nombre de la acción (ej: actualizar-tarea)"
                          className="h-10 border-[#e8eaed] focus:border-[#55c3c5] rounded-md"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsCreatingNewAction(false);
                            setCustomActionName('');
                          }}
                          className="text-xs text-[#6b6a6e] hover:text-[#55c3c5] h-7"
                        >
                          ← Volver a seleccionar existente
                        </Button>
                      </>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleAddAction}
                        disabled={isCreatingNewAction ? !customActionName : !newAction.name}
                        className="h-9 px-4 bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md disabled:opacity-50 text-sm flex-1"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Agregar al Flujo
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAddingAction(false);
                          setNewAction({ name: '', dependencies: [] });
                          setCustomActionName('');
                          setIsCreatingNewAction(false);
                        }}
                        variant="outline"
                        className="h-9 px-4 rounded-md text-sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                    
                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-100">
                      <AlertCircle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">La acción se agregará al final del flujo de ejecución</p>
                    </div>
                  </div>
                </div>
              )}

              {tarea.actions.length > 0 ? (
                <div className="relative">
                  {/* Nota informativa */}
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Recordatorio Importante</p>
                        <p className="text-xs text-amber-700 mt-0.5">Recordá de agregar la funcionalidad de la acción al Backend</p>
                      </div>
                    </div>
                  </div>

                  {/* Línea vertical de conexión estilo Git */}
                  <div className="absolute left-[23px] top-[92px] bottom-[52px] w-[2px] bg-[#e8eaed]"></div>
                  
                  <div className="space-y-0">
                    {tarea.actions.map((action, index) => (
                      <div key={index} className="relative flex items-start gap-4 py-2">
                        {/* Nodo de commit estilo Git con número */}
                        <div className="relative z-10 flex-shrink-0 pt-1">
                          <div className="w-[46px] h-[46px] rounded-full border-2 border-[#55c3c5] bg-white flex items-center justify-center shadow-sm">
                            <span className="text-[#55c3c5] font-bold text-base">{index + 1}</span>
                          </div>
                          
                          {/* Línea de conexión al siguiente nodo */}
                          {index < tarea.actions.length - 1 && (
                            <div className="absolute top-[46px] left-[22px] w-[2px] h-[calc(100%+8px)] bg-[#e8eaed]"></div>
                          )}
                        </div>

                        {/* Card de contenido mejorado */}
                        <div className="flex-1 group">
                          <div className="relative flex items-start gap-3 p-4 bg-gradient-to-r from-white to-[#fafbfc] rounded-lg border border-[#e8eaed] hover:border-[#55c3c5]/50 hover:shadow-md transition-all overflow-hidden">
                            {/* Barra lateral de color */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#55c3c5] to-[#3db3b5]"></div>
                            
                            <div className="flex-1 min-w-0 pl-3">
                              <div className="mb-2">
                                <h4 className="font-semibold text-[#3b3a3e]">{action.name}</h4>
                              </div>
                              
                              {action.dependencies.length > 0 ? (
                                <div className="flex items-center gap-1.5 text-xs text-[#6b6a6e]">
                                  <GitBranch className="h-3.5 w-3.5 text-[#55c3c5]" />
                                  <span>depende de:</span>
                                  <code className="px-2 py-0.5 bg-[#55c3c5]/10 rounded text-[#55c3c5] font-mono">{action.dependencies[0]}</code>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                  <Check className="h-3.5 w-3.5" />
                                  <span className="font-medium">Acción inicial del flujo</span>
                                </div>
                              )}
                            </div>

                            {/* Controles mejorados */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveActionUp(index)}
                                disabled={index === 0}
                                className="h-8 w-8 p-0 text-[#6b6a6e] hover:text-[#55c3c5] hover:bg-[#55c3c5]/10 rounded disabled:opacity-20 disabled:cursor-not-allowed"
                                title="Mover arriba"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveActionDown(index)}
                                disabled={index === tarea.actions.length - 1}
                                className="h-8 w-8 p-0 text-[#6b6a6e] hover:text-[#55c3c5] hover:bg-[#55c3c5]/10 rounded disabled:opacity-20 disabled:cursor-not-allowed"
                                title="Mover abajo"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <div className="w-px bg-[#e8eaed] mx-1"></div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAction(action.name)}
                                className="h-8 w-8 p-0 text-[#6b6a6e] hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar acción"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Nodo final */}
                    <div className="flex items-start gap-4 pt-2">
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-[46px] h-[46px] rounded-full border-2 border-emerald-600 bg-white flex items-center justify-center shadow-sm">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="text-sm font-semibold text-[#3b3a3e]">Flujo Completado</p>
                        <p className="text-xs text-[#6b6a6e] mt-0.5">Todas las acciones se ejecutan en secuencia</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-[#f8f9fa] rounded-lg border border-dashed border-[#e8eaed]">
                  <Zap className="h-10 w-10 text-[#6b6a6e] mx-auto mb-2 opacity-50" />
                  <p className="text-[#6b6a6e] text-sm">No hay acciones configuradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Estados */}
        <TabsContent value="estados" className="space-y-4">
          <Card className="border border-[#e8eaed] shadow-sm">
            <CardHeader className="border-b border-[#e8eaed] py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#55c3c5]/10 rounded-md">
                    <Settings className="h-4 w-4 text-[#55c3c5]" />
                  </div>
                  <CardTitle className="text-sm text-[#3b3a3e] tracking-tight">Configuración de Estados</CardTitle>
                </div>
                <Button
                  onClick={() => handleOpenStatusDialog()}
                  className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-8 px-3 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Nuevo Estado
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {tarea.statusConfig.map((statusItem, statusIndex) => (
                  <div key={statusIndex} className="group border border-[#e8eaed] rounded-lg overflow-hidden hover:border-[#55c3c5]/50 transition-all">
                    <div className="bg-gradient-to-r from-[#f8f9fa] to-white p-3 border-b border-[#e8eaed] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#3b3a3e] text-sm">{statusItem.status}</h3>
                        <Badge className="bg-[#55c3c5]/10 text-[#55c3c5] border-[#55c3c5]/20 text-xs px-1.5 py-0 h-5">
                          {statusItem.subStatusList.length}
                        </Badge>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenStatusDialog(statusItem)}
                          className="h-7 w-7 p-0 text-[#55c3c5] hover:bg-[#55c3c5]/10 rounded-md"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStatus(statusItem.status)}
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 bg-white space-y-2">
                      {statusItem.subStatusList.map((subStatus, subIndex) => (
                        <div key={subIndex} className="p-2 bg-[#f8f9fa] rounded-md border border-[#e8eaed]">
                          <p className="font-medium text-[#3b3a3e] text-xs mb-1.5 flex items-center gap-1.5">
                            <Circle className="h-2.5 w-2.5 text-[#55c3c5] fill-[#55c3c5]" />
                            {subStatus.subStatus}
                          </p>
                          {subStatus.reasons.length > 0 && (
                            <div className="ml-4 space-y-0.5">
                              {subStatus.reasons.map((reason, reasonIndex) => (
                                <div key={reasonIndex} className="text-xs text-[#6b6a6e] flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-[#55c3c5] flex-shrink-0"></span>
                                  <span className="truncate">{reason}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {statusItem.subStatusList.length === 0 && (
                        <p className="text-xs text-[#6b6a6e] italic">Sin sub-estados</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <Card className="border border-[#e8eaed] shadow-sm">
            <CardHeader className="border-b border-[#e8eaed] py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#55c3c5]/10 rounded-md">
                  <History className="h-4 w-4 text-[#55c3c5]" />
                </div>
                <div>
                  <CardTitle className="text-sm text-[#3b3a3e] tracking-tight">Histórico de Versiones</CardTitle>
                  <p className="text-xs text-[#6b6a6e] mt-0.5">{tarea.historico.length} versiones anteriores</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {tarea.historico.length > 0 ? (
                <div className="space-y-3">
                  {tarea.historico.map((version) => (
                    <div
                      key={version.version}
                      className="p-3 bg-gradient-to-br from-white to-[#f8f9fa] rounded-lg border border-[#e8eaed] hover:border-[#55c3c5]/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-gradient-to-r from-[#55c3c5] to-[#3db3b5] text-white border-0 shadow-md text-xs px-2 py-0.5">
                              V{version.version}
                            </Badge>
                            <span className="text-xs text-[#6b6a6e]">{version.date}</span>
                          </div>
                          <p className="text-xs text-[#6b6a6e]">por {version.user}</p>
                          <p className="text-xs text-[#3b3a3e] mt-1">{version.changes}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewVersion(version)}
                          className="border-[#55c3c5] text-[#55c3c5] hover:bg-[#55c3c5]/10 rounded-md h-7 px-2 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#e8eaed]">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#55c3c5]">{version.formFields.length}</p>
                          <p className="text-xs text-[#6b6a6e]">Campos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#55c3c5]">{version.actions.length}</p>
                          <p className="text-xs text-[#6b6a6e]">Acciones</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#55c3c5]">{version.statusConfig.length}</p>
                          <p className="text-xs text-[#6b6a6e]">Estados</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-[#f8f9fa] rounded-lg border border-dashed border-[#e8eaed]">
                  <History className="h-10 w-10 text-[#6b6a6e] mx-auto mb-2 opacity-50" />
                  <p className="text-[#6b6a6e] text-sm">No hay versiones anteriores</p>
                  <p className="text-xs text-[#6b6a6e] mt-1">Las versiones se guardarán automáticamente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar campo - CON SELECTS */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingField?.id && tarea.formFields.some(f => f.id === editingField.id) ? 'Editar Campo' : 'Nuevo Campo'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configura todas las propiedades del campo del formulario
            </DialogDescription>
          </DialogHeader>

          {editingField && (
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">ID</Label>
                  <Input
                    type="number"
                    value={editingField.id}
                    onChange={(e) => setEditingField({ ...editingField, id: parseInt(e.target.value) })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Name (interno)</Label>
                  <Input
                    value={editingField.name}
                    onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                    placeholder="ej: email"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={editingField.type}
                    onValueChange={(value) => setEditingField({ ...editingField, type: value })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(type => (
                        <SelectItem key={type} value={type} className="text-sm">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Component</Label>
                  <Select
                    value={editingField.component}
                    onValueChange={(value: any) => setEditingField({ ...editingField, component: value })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {componentOptions.map(comp => (
                        <SelectItem key={comp.value} value={comp.value} className="text-sm">
                          {comp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold text-[#3b3a3e] mb-3 text-sm">Field Configuration</h4>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={editingField.field.label}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        field: { ...editingField.field, label: e.target.value }
                      })}
                      placeholder="ej: E-mail (Obligatorio)"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Field Type</Label>
                      <Select
                        value={editingField.field.type}
                        onValueChange={(value) => setEditingField({
                          ...editingField,
                          field: { ...editingField.field, type: value }
                        })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypeOptions.map(type => (
                            <SelectItem key={type} value={type} className="text-sm">{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        value={editingField.field.placeholder || ''}
                        onChange={(e) => setEditingField({
                          ...editingField,
                          field: { ...editingField.field, placeholder: e.target.value }
                        })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Error Message</Label>
                    <Input
                      value={editingField.field.errorMessage}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        field: { ...editingField.field, errorMessage: e.target.value }
                      })}
                      placeholder="Mensaje de error"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-[#f8f9fa] rounded-md">
                    <input
                      type="checkbox"
                      checked={editingField.field.isRequired}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        field: { ...editingField.field, isRequired: e.target.checked }
                      })}
                      className="w-3.5 h-3.5 rounded border-[#e8eaed] text-[#55c3c5] focus:ring-2 focus:ring-[#55c3c5]/20"
                    />
                    <span className="text-xs font-medium text-[#3b3a3e]">Campo Requerido</span>
                  </div>

                  {(editingField.component === 'dropdown' || editingField.component === 'dropdown-state') && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Opciones (separadas por coma)</Label>
                      <Textarea
                        value={editingField.field.options?.join(', ') || ''}
                        onChange={(e) => setEditingField({
                          ...editingField,
                          field: {
                            ...editingField.field,
                            options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                          }
                        })}
                        placeholder="Opción 1, Opción 2, Opción 3"
                        rows={3}
                        className="resize-none text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFieldDialogOpen(false)}
              className="rounded-md h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveField}
              className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-9 text-sm"
            >
              {editingField?.id && tarea.formFields.some(f => f.id === editingField.id) ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar estado */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingStatus?.status && tarea.statusConfig.some(s => s.status === editingStatus.status) ? 'Editar Estado' : 'Nuevo Estado'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configura el estado con sus sub-estados y motivos
            </DialogDescription>
          </DialogHeader>

          {editingStatus && (
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre del Estado</Label>
                <Input
                  value={editingStatus.status}
                  onChange={(e) => setEditingStatus({ ...editingStatus, status: e.target.value })}
                  placeholder="ej: Pendiente, En Proceso, Aprobado"
                  className="h-9 text-sm"
                />
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-[#3b3a3e] text-sm">Sub-Estados</h4>
                  <Button
                    onClick={() => {
                      const subStatus = prompt('Nombre del sub-estado:');
                      if (subStatus) handleAddSubStatus(subStatus);
                    }}
                    className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-7 px-3 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                </div>

                <div className="space-y-2">
                  {editingStatus.subStatusList.map((subStatus, index) => (
                    <div key={index} className="p-3 bg-[#f8f9fa] rounded-md border border-[#e8eaed]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-[#3b3a3e] text-sm">{subStatus.subStatus}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSubStatus(subStatus.subStatus)}
                          className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="ml-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-[#6b6a6e]">Motivos:</p>
                          <Button
                            onClick={() => {
                              const reason = prompt('Nuevo motivo:');
                              if (reason) handleAddReason(subStatus.subStatus, reason);
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-[#55c3c5] hover:bg-[#55c3c5]/10 rounded-md"
                          >
                            <Plus className="h-3 w-3 mr-0.5" />
                            Agregar
                          </Button>
                        </div>
                        {subStatus.reasons.length > 0 ? (
                          <div className="space-y-1">
                            {subStatus.reasons.map((reason, rIndex) => (
                              <div key={rIndex} className="flex items-center justify-between p-1.5 bg-white rounded border border-[#e8eaed] text-xs">
                                <span className="text-[#3b3a3e]">{reason}</span>
                                <button
                                  onClick={() => handleRemoveReason(subStatus.subStatus, reason)}
                                  className="text-red-600 hover:text-red-700 p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#6b6a6e] italic">Sin motivos</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {editingStatus.subStatusList.length === 0 && (
                    <p className="text-xs text-[#6b6a6e] italic text-center py-3">No hay sub-estados</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              className="rounded-md h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveStatus}
              className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-9 text-sm"
            >
              {editingStatus?.status && tarea.statusConfig.some(s => s.status === editingStatus.status) ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver versión del histórico */}
      <Dialog open={!!viewingVersion} onOpenChange={() => setViewingVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-[#55c3c5] to-[#3db3b5] text-white border-0">
                V{viewingVersion?.version}
              </Badge>
              {viewingVersion?.date}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Por {viewingVersion?.user} • {viewingVersion?.changes}
            </DialogDescription>
          </DialogHeader>

          {viewingVersion && (
            <div className="space-y-4 py-3">
              <div>
                <h4 className="font-semibold text-[#3b3a3e] mb-2 flex items-center gap-2 text-sm">
                  <FileText className="h-3.5 w-3.5" />
                  Campos del Formulario ({viewingVersion.formFields.length})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {viewingVersion.formFields.map((field) => (
                    <div key={field.id} className="p-2 bg-[#f8f9fa] rounded-md border border-[#e8eaed] text-xs">
                      <p className="font-medium text-[#3b3a3e]">{field.field.label}</p>
                      <p className="text-[#6b6a6e] mt-0.5">
                        {field.name} • {field.component} • ID: {field.id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-[#3b3a3e] mb-2 flex items-center gap-2 text-sm">
                  <Zap className="h-3.5 w-3.5" />
                  Acciones ({viewingVersion.actions.length})
                </h4>
                <div className="space-y-1.5">
                  {viewingVersion.actions.map((action, idx) => (
                    <div key={idx} className="p-2 bg-[#f8f9fa] rounded-md border border-[#e8eaed] text-xs">
                      <p className="font-medium text-[#3b3a3e]">{action.name}</p>
                      {action.dependencies.length > 0 && (
                        <p className="text-[#6b6a6e] mt-0.5">
                          Depende de: {action.dependencies.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingVersion(null)}
              className="rounded-md h-9 text-sm"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => viewingVersion && handleRestoreVersion(viewingVersion)}
              className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-9 text-sm"
            >
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DndProvider>
  );
}
