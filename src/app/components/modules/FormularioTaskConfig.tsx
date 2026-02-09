import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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
import {
  ArrowLeft,
  Save,
  FileText,
  Zap,
  Plus,
  X,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Settings,
  Type,
  List,
  CheckSquare,
  FileType,
  Repeat,
  Circle,
  AlertCircle,
  Search,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTaskConfig } from '../../hooks/use-task-config';
import type {
  FormFieldResponse,
  FormResponse,
  TaskConfigActionsResponse,
  ActionItemWithDependenciesResponse,
  TaskConfigSaveRequest,
} from '../../services/api';

interface FormFieldConfig {
  label: string;
  value: unknown;
  type: string;
  placeholder?: string;
  isRequired: boolean;
  errorMessage: string;
  options?: string[];
  formatAccept?: string[] | null;
}

interface FormFieldEditable {
  id: number;
  name: string;
  type: string;
  component: string;
  field: FormFieldConfig;
}

interface ActionEditable {
  name: string;
  dependencies: string[];
}

interface StatusConfigEditable {
  status: string;
  subStatusList: { subStatus: string; reasons: string[] }[];
}

const COMPONENT_OPTIONS = [
  { value: 'input', label: 'Input', iconComponent: Type },
  { value: 'dropdown', label: 'Dropdown', iconComponent: List },
  { value: 'checkbox', label: 'Checkbox', iconComponent: CheckSquare },
  { value: 'notes', label: 'Notes', iconComponent: FileType },
  { value: 'dropdown-state', label: 'Dropdown State', iconComponent: Repeat },
  { value: 'fileUploader', label: 'File Uploader', iconComponent: FileType },
];

const TYPE_OPTIONS = ['string', 'string[]', 'boolean', 'number', 'text'];
const FIELD_TYPE_OPTIONS = ['text', 'email', 'number', 'boolean', 'date', 'tel', 'url', 'file'];

function topologicalOrder(actions: ActionItemWithDependenciesResponse[]): number[] {
  const byId = new Map(actions.map((a) => [a.actionItemId, a]));
  const inDegree = new Map<number, number>();
  actions.forEach((a) => {
    const depsInGraph = (a.dependencyActionItemIds || []).filter((id) => byId.has(id)).length;
    inDegree.set(a.actionItemId, depsInGraph);
  });
  const queue = actions.filter((a) => (inDegree.get(a.actionItemId) ?? 0) === 0).map((a) => a.actionItemId);
  const order: number[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    actions.forEach((a) => {
      if ((a.dependencyActionItemIds || []).includes(id)) {
        const newDeg = (inDegree.get(a.actionItemId) ?? 1) - 1;
        inDegree.set(a.actionItemId, newDeg);
        if (newDeg === 0) queue.push(a.actionItemId);
      }
    });
  }
  const remaining = actions.map((a) => a.actionItemId).filter((i) => !order.includes(i));
  return [...order, ...remaining];
}

function actionsFromApiResponse(res: TaskConfigActionsResponse): ActionEditable[] {
  const actions = res.actions || [];
  const byId = new Map(actions.map((a) => [a.actionItemId, a]));
  const order = topologicalOrder(actions);
  return order.map((actionItemId) => {
    const a = byId.get(actionItemId);
    const name = a?.actionName ?? `#${actionItemId}`;
    const depIds = a?.dependencyActionItemIds ?? [];
    const dependencies = depIds
      .map((id) => byId.get(id)?.actionName)
      .filter((n): n is string => !!n);
    return { name, dependencies };
  });
}

function normalizeFormField(f: FormFieldResponse): FormFieldEditable {
  const fieldObj = (f.field || {}) as Record<string, unknown>;
  return {
    id: typeof f.id === 'number' ? f.id : 0,
    name: typeof f.name === 'string' ? f.name : '',
    type: typeof f.type === 'string' ? f.type : 'string',
    component: typeof f.component === 'string' ? f.component : 'input',
    field: {
      label: typeof fieldObj.label === 'string' ? fieldObj.label : '',
      value: fieldObj.value ?? null,
      type: typeof fieldObj.type === 'string' ? fieldObj.type : 'text',
      placeholder: typeof fieldObj.placeholder === 'string' ? fieldObj.placeholder : '',
      isRequired: Boolean(fieldObj.isRequired),
      errorMessage: typeof fieldObj.errorMessage === 'string' ? fieldObj.errorMessage : '',
      options: Array.isArray(fieldObj.options) ? (fieldObj.options as string[]) : undefined,
      formatAccept: Array.isArray(fieldObj.formatAccept) ? (fieldObj.formatAccept as string[]) : null,
    },
  };
}

function formFieldToApi(f: FormFieldEditable): FormFieldResponse {
  return {
    id: f.id,
    name: f.name,
    type: f.type,
    component: f.component,
    field: {
      ...f.field,
      options: f.field.options ?? null,
      formatAccept: f.field.formatAccept ?? null,
    },
  };
}

interface FormularioTaskConfigProps {
  taskTypeId: number;
  taskTypeName: string;
  onBack: () => void;
}

export function FormularioTaskConfig({ taskTypeId, taskTypeName, onBack }: FormularioTaskConfigProps) {
  const taskConfigApi = useTaskConfig();
  const [activeTab, setActiveTab] = useState('formulario');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [formFields, setFormFields] = useState<FormFieldEditable[]>([]);
  const [actions, setActions] = useState<ActionEditable[]>([]);
  const [statusConfig, setStatusConfig] = useState<StatusConfigEditable[]>([]);
  const [fileConfig, setFileConfig] = useState<unknown>(null);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [searchField, setSearchField] = useState('');

  const [editingField, setEditingField] = useState<FormFieldEditable | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusConfigEditable | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newAction, setNewAction] = useState({ name: '', dependencies: [] as string[] });
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [customActionName, setCustomActionName] = useState('');
  const [isCreatingNewAction, setIsCreatingNewAction] = useState(false);

  const loadData = useCallback(async () => {
    if (!taskConfigApi.hasApi) return;
    setLoading(true);
    try {
      const [formRes, actionsListRes] = await Promise.all([
        taskConfigApi.getFormByTaskTypeId(taskTypeId),
        taskConfigApi.getActions(),
      ]);

      if (actionsListRes?.data?.length) {
        setAvailableActions(actionsListRes.data.map((a) => a.name || String(a.id)).filter(Boolean));
      }

      const formData = formRes?.data;
      if (formData?.taskConfigId != null && formData?.taskName != null) {
        setTaskName(formData.taskName);
        setFormFields((formData.formFields || []).map(normalizeFormField));
        setStatusConfig(
          Array.isArray(formData.statusConfig)
            ? (formData.statusConfig as StatusConfigEditable[])
            : []
        );
        setFileConfig(formData.fileConfig ?? null);

        const actionsRes = await taskConfigApi.getTaskConfigActions(formData.taskConfigId);
        if (actionsRes?.data) {
          setActions(actionsFromApiResponse(actionsRes.data));
        }
      } else {
        setTaskName(taskTypeName);
        setFormFields([]);
        setActions([]);
        setStatusConfig([]);
        setFileConfig(null);
      }
    } catch {
      toast.error('No se pudo cargar la configuración del tipo de tarea.');
      setTaskName(taskTypeName);
      setFormFields([]);
      setActions([]);
      setStatusConfig([]);
    } finally {
      setLoading(false);
    }
  }, [taskConfigApi, taskTypeId, taskTypeName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!taskConfigApi.hasApi) return;
    setSaving(true);
    try {
      const payload: TaskConfigSaveRequest = {
        taskTypeId,
        actions,
        form: { formFields: formFields.map(formFieldToApi) },
        statusConfig: statusConfig as unknown,
        fileConfig: fileConfig ?? undefined,
      };
      await taskConfigApi.postTaskConfig(payload);
      toast.success('Configuración guardada correctamente.');
      loadData();
    } catch {
      toast.error('Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const moveField = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    const next = [...formFields];
    const [removed] = next.splice(dragIndex, 1);
    next.splice(hoverIndex, 0, removed);
    setFormFields(next);
  };

  const handleOpenFieldDialog = (field?: FormFieldEditable) => {
    if (field) {
      setEditingField(JSON.parse(JSON.stringify(field)));
    } else {
      setEditingField({
        id: Math.max(0, ...formFields.map((f) => f.id)) + 1,
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
        },
      });
    }
    setIsFieldDialogOpen(true);
  };

  const handleSaveField = () => {
    if (!editingField) return;
    const idx = formFields.findIndex((f) => f.id === editingField.id);
    if (idx >= 0) {
      const next = [...formFields];
      next[idx] = editingField;
      setFormFields(next);
    } else {
      setFormFields([...formFields, editingField]);
    }
    setIsFieldDialogOpen(false);
    setEditingField(null);
    toast.success(idx >= 0 ? 'Campo actualizado' : 'Campo agregado');
  };

  const handleDeleteField = (id: number) => {
    setFormFields(formFields.filter((f) => f.id !== id));
    toast.success('Campo eliminado');
  };

  const handleAddAction = () => {
    const actionName = isCreatingNewAction ? customActionName : newAction.name;
    if (!actionName) return;
    const dependencies =
      actions.length > 0 ? [actions[actions.length - 1].name] : [];
    setActions([...actions, { name: actionName, dependencies }]);
    if (isCreatingNewAction && !availableActions.includes(actionName)) {
      setAvailableActions([...availableActions, actionName]);
    }
    setNewAction({ name: '', dependencies: [] });
    setCustomActionName('');
    setIsAddingAction(false);
    setIsCreatingNewAction(false);
    toast.success('Acción agregada');
  };

  const handleDeleteAction = (actionName: string) => {
    const updated = actions.filter((a) => a.name !== actionName);
    const reajusted = updated.map((action, i) => ({
      ...action,
      dependencies: i === 0 ? [] : [updated[i - 1].name],
    }));
    setActions(reajusted);
    toast.success('Acción eliminada');
  };

  const handleMoveActionUp = (index: number) => {
    if (index === 0) return;
    const next = [...actions];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    const reajusted = next.map((a, i) => ({
      ...a,
      dependencies: i === 0 ? [] : [next[i - 1].name],
    }));
    setActions(reajusted);
  };

  const handleMoveActionDown = (index: number) => {
    if (index >= actions.length - 1) return;
    const next = [...actions];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    const reajusted = next.map((a, i) => ({
      ...a,
      dependencies: i === 0 ? [] : [next[i - 1].name],
    }));
    setActions(reajusted);
  };

  const handleOpenStatusDialog = (status?: StatusConfigEditable) => {
    if (status) {
      setEditingStatus(JSON.parse(JSON.stringify(status)));
    } else {
      setEditingStatus({ status: '', subStatusList: [] });
    }
    setIsStatusDialogOpen(true);
  };

  const handleSaveStatus = () => {
    if (!editingStatus) return;
    const idx = statusConfig.findIndex((s) => s.status === editingStatus.status);
    if (idx >= 0) {
      const next = [...statusConfig];
      next[idx] = editingStatus;
      setStatusConfig(next);
    } else {
      setStatusConfig([...statusConfig, editingStatus]);
    }
    setIsStatusDialogOpen(false);
    setEditingStatus(null);
    toast.success(idx >= 0 ? 'Estado actualizado' : 'Estado agregado');
  };

  const handleDeleteStatus = (statusName: string) => {
    setStatusConfig(statusConfig.filter((s) => s.status !== statusName));
    toast.success('Estado eliminado');
  };

  const handleAddSubStatus = (subStatus: string) => {
    if (!editingStatus) return;
    setEditingStatus({
      ...editingStatus,
      subStatusList: [...editingStatus.subStatusList, { subStatus, reasons: [] }],
    });
  };

  const handleRemoveSubStatus = (subStatusName: string) => {
    if (!editingStatus) return;
    setEditingStatus({
      ...editingStatus,
      subStatusList: editingStatus.subStatusList.filter((s) => s.subStatus !== subStatusName),
    });
  };

  const handleAddReason = (subStatusName: string, reason: string) => {
    if (!editingStatus) return;
    setEditingStatus({
      ...editingStatus,
      subStatusList: editingStatus.subStatusList.map((s) =>
        s.subStatus === subStatusName ? { ...s, reasons: [...s.reasons, reason] } : s
      ),
    });
  };

  const handleRemoveReason = (subStatusName: string, reason: string) => {
    if (!editingStatus) return;
    setEditingStatus({
      ...editingStatus,
      subStatusList: editingStatus.subStatusList.map((s) =>
        s.subStatus === subStatusName ? { ...s, reasons: s.reasons.filter((r) => r !== reason) } : s
      ),
    });
  };

  const filteredFields = formFields.filter(
    (f) =>
      f.name.toLowerCase().includes(searchField.toLowerCase()) ||
      f.field.label.toLowerCase().includes(searchField.toLowerCase()) ||
      f.component.toLowerCase().includes(searchField.toLowerCase())
  );

  const getComponentIcon = (component: string) =>
    COMPONENT_OPTIONS.find((c) => c.value === component)?.iconComponent ?? Type;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center gap-2 text-[#6b6a6e]">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Cargando formulario y acciones…</span>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 space-y-5">
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
              <h1 className="text-xl text-[#3b3a3e] tracking-tight font-semibold">{taskTypeName}</h1>
              <p className="text-[#6b6a6e] text-sm">{taskName || 'Configuración de formulario y acciones'}</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-lg shadow-lg shadow-[#55c3c5]/20 h-9 px-4 text-sm"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Guardar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-[#e8eaed] p-0.5 rounded-lg inline-flex h-9">
            <TabsTrigger
              value="formulario"
              className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              Formulario
              <span className="ml-0.5 bg-white/20 text-white text-xs px-1 py-0 h-4 min-w-[1rem] flex items-center justify-center rounded">
                {formFields.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="acciones"
              className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              Acciones
              <span className="ml-0.5 bg-white/20 text-white text-xs px-1 py-0 h-4 min-w-[1rem] flex items-center justify-center rounded">
                {actions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="estados"
              className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5"
            >
              <Settings className="h-3.5 w-3.5" />
              Estados
              <span className="ml-0.5 bg-white/20 text-white text-xs px-1 py-0 h-4 min-w-[1rem] flex items-center justify-center rounded">
                {statusConfig.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formulario" className="space-y-4">
            <Card className="border border-[#e8eaed] shadow-sm">
              <CardHeader className="border-b border-[#e8eaed] py-3 px-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#55c3c5]" />
                    <CardTitle className="text-sm text-[#3b3a3e]">Campos del formulario</CardTitle>
                  </div>
                  <Button onClick={() => handleOpenFieldDialog()} className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-8 px-3 text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    Nuevo campo
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6a6e]" />
                  <Input
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    placeholder="Buscar por nombre, etiqueta o tipo..."
                    className="h-9 pl-9 border-[#e8eaed] rounded-md text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {(searchField ? filteredFields : formFields).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(searchField ? filteredFields : formFields).map((field, index) => (
                      <FieldCard
                        key={field.id}
                        field={field}
                        index={index}
                        moveField={moveField}
                        onEdit={handleOpenFieldDialog}
                        onDelete={handleDeleteField}
                        getComponentIcon={getComponentIcon}
                        isDragDisabled={!!searchField}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-[#f8f9fa] rounded-lg border border-dashed border-[#e8eaed]">
                    <FileText className="h-10 w-10 text-[#6b6a6e] mx-auto mb-3 opacity-50" />
                    <p className="text-[#3b3a3e] font-medium mb-1">No hay campos</p>
                    <Button onClick={() => handleOpenFieldDialog()} className="mt-4 bg-[#55c3c5] hover:bg-[#3db3b5] text-white h-8 text-xs">
                      <Plus className="mr-1 h-3 w-3" />
                      Agregar primer campo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acciones" className="space-y-4">
            <Card className="border border-[#e8eaed] shadow-sm">
              <CardHeader className="border-b border-[#e8eaed] py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#55c3c5]" />
                    <CardTitle className="text-sm text-[#3b3a3e]">Acciones y dependencias</CardTitle>
                  </div>
                  <Button onClick={() => setIsAddingAction(true)} className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-8 px-3 text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    Nueva
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {isAddingAction && (
                  <div className="mb-4 p-4 bg-[#55c3c5]/5 rounded-lg border border-[#55c3c5]/30 space-y-3">
                    {!isCreatingNewAction ? (
                      <>
                        <Label className="text-sm font-semibold text-[#3b3a3e]">Seleccionar acción</Label>
                        <Select
                          value={newAction.name}
                          onValueChange={(v) => {
                            if (v === '__crear_nueva__') {
                              setIsCreatingNewAction(true);
                              setNewAction({ name: '', dependencies: [] });
                            } else {
                              setNewAction({ ...newAction, name: v });
                            }
                          }}
                        >
                          <SelectTrigger className="h-10 border-[#e8eaed] rounded-md">
                            <SelectValue placeholder="Elegir acción..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableActions.map((name) => (
                              <SelectItem key={name} value={name} className="text-sm">
                                {name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__crear_nueva__" className="text-sm font-semibold text-[#55c3c5] border-t mt-1 pt-2">
                              <span className="flex items-center gap-2">
                                <Plus className="h-3 w-3" />
                                Crear nueva acción
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <>
                        <Label className="text-sm font-semibold text-[#3b3a3e]">Nueva acción</Label>
                        <Input
                          value={customActionName}
                          onChange={(e) => setCustomActionName(e.target.value)}
                          placeholder="Nombre de la acción (ej: actualizar-tarea)"
                          className="h-10 border-[#e8eaed] rounded-md"
                        />
                        <Button variant="ghost" size="sm" onClick={() => { setIsCreatingNewAction(false); setCustomActionName(''); }} className="text-xs text-[#6b6a6e]">
                          ← Volver
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
                        Agregar
                      </Button>
                      <Button
                        variant="outline"
                        className="h-9 px-4 rounded-md text-sm"
                        onClick={() => { setIsAddingAction(false); setNewAction({ name: '', dependencies: [] }); setCustomActionName(''); setIsCreatingNewAction(false); }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {actions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">Agregá la funcionalidad de cada acción en el backend.</p>
                    </div>
                    {actions.map((action, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[#e8eaed] hover:border-[#55c3c5]/50"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#3b3a3e]">{action.name}</h4>
                          {action.dependencies.length > 0 ? (
                            <p className="text-xs text-[#6b6a6e] mt-0.5">depende de: {action.dependencies.join(', ')}</p>
                          ) : (
                            <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" />
                              Acción inicial
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleMoveActionUp(index)} disabled={index === 0} className="h-8 w-8 p-0">
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleMoveActionDown(index)} disabled={index === actions.length - 1} className="h-8 w-8 p-0">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAction(action.name)} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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

          <TabsContent value="estados" className="space-y-4">
            <Card className="border border-[#e8eaed] shadow-sm">
              <CardHeader className="border-b border-[#e8eaed] py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-[#55c3c5]" />
                    <CardTitle className="text-sm text-[#3b3a3e]">Configuración de estados</CardTitle>
                  </div>
                  <Button onClick={() => handleOpenStatusDialog()} className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-8 px-3 text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    Nuevo estado
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {statusConfig.map((item, i) => (
                    <div key={i} className="border border-[#e8eaed] rounded-lg overflow-hidden hover:border-[#55c3c5]/50">
                      <div className="bg-[#f8f9fa] p-3 border-b border-[#e8eaed] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#3b3a3e] text-sm">{item.status}</h3>
                          <span className="text-xs text-[#6b6a6e]">{item.subStatusList.length} sub-estados</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenStatusDialog(item)} className="h-7 w-7 p-0 text-[#55c3c5]">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteStatus(item.status)} className="h-7 w-7 p-0 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-white space-y-2">
                        {item.subStatusList.map((sub, j) => (
                          <div key={j} className="p-2 bg-[#f8f9fa] rounded-md border border-[#e8eaed]">
                            <p className="font-medium text-[#3b3a3e] text-xs flex items-center gap-1.5">
                              <Circle className="h-2.5 w-2.5 text-[#55c3c5] fill-[#55c3c5]" />
                              {sub.subStatus}
                            </p>
                            {sub.reasons.length > 0 && (
                              <div className="ml-4 mt-1 space-y-0.5">
                                {sub.reasons.map((r, k) => (
                                  <div key={k} className="text-xs text-[#6b6a6e] flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-[#55c3c5]" />
                                    {r}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog campo */}
        <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">
                {editingField && formFields.some((f) => f.id === editingField.id) ? 'Editar campo' : 'Nuevo campo'}
              </DialogTitle>
              <DialogDescription className="text-xs">Configura las propiedades del campo</DialogDescription>
            </DialogHeader>
            {editingField && (
              <div className="space-y-4 py-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">ID</Label>
                    <Input
                      type="number"
                      value={editingField.id}
                      onChange={(e) => setEditingField({ ...editingField, id: parseInt(e.target.value) || 0 })}
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
                    <Select value={editingField.type} onValueChange={(v) => setEditingField({ ...editingField, type: v })}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t} className="text-sm">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Component</Label>
                    <Select
                      value={editingField.component}
                      onValueChange={(v) => setEditingField({ ...editingField, component: v })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPONENT_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value} className="text-sm">
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-[#3b3a3e] mb-3 text-sm">Field</h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={editingField.field.label}
                        onChange={(e) => setEditingField({ ...editingField, field: { ...editingField.field, label: e.target.value } })}
                        placeholder="ej: E-mail (Obligatorio)"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Field type</Label>
                        <Select
                          value={editingField.field.type}
                          onValueChange={(v) => setEditingField({ ...editingField, field: { ...editingField.field, type: v } })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPE_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t} className="text-sm">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          value={editingField.field.placeholder || ''}
                          onChange={(e) => setEditingField({ ...editingField, field: { ...editingField.field, placeholder: e.target.value } })}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Error message</Label>
                      <Input
                        value={editingField.field.errorMessage}
                        onChange={(e) => setEditingField({ ...editingField, field: { ...editingField.field, errorMessage: e.target.value } })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-[#f8f9fa] rounded-md">
                      <input
                        type="checkbox"
                        checked={editingField.field.isRequired}
                        onChange={(e) => setEditingField({ ...editingField, field: { ...editingField.field, isRequired: e.target.checked } })}
                        className="w-3.5 h-3.5 rounded border-[#e8eaed] text-[#55c3c5]"
                      />
                      <span className="text-xs font-medium text-[#3b3a3e]">Requerido</span>
                    </div>
                    {(editingField.component === 'dropdown' || editingField.component === 'dropdown-state') && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Opciones (separadas por coma)</Label>
                        <Textarea
                          value={editingField.field.options?.join(', ') || ''}
                          onChange={(e) =>
                            setEditingField({
                              ...editingField,
                              field: {
                                ...editingField.field,
                                options: e.target.value
                                  .split(',')
                                  .map((o) => o.trim())
                                  .filter(Boolean),
                              },
                            })
                          }
                          placeholder="Opción 1, Opción 2"
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
              <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)} className="rounded-md h-9 text-sm">
                Cancelar
              </Button>
              <Button onClick={handleSaveField} className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-9 text-sm">
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog estado */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">
                {editingStatus && statusConfig.some((s) => s.status === editingStatus.status) ? 'Editar estado' : 'Nuevo estado'}
              </DialogTitle>
              <DialogDescription className="text-xs">Configura el estado con sub-estados y motivos</DialogDescription>
            </DialogHeader>
            {editingStatus && (
              <div className="space-y-4 py-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre del estado</Label>
                  <Input
                    value={editingStatus.status}
                    onChange={(e) => setEditingStatus({ ...editingStatus, status: e.target.value })}
                    placeholder="ej: Pendiente, En Proceso"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-[#3b3a3e] text-sm">Sub-estados</h4>
                    <Button
                      onClick={() => {
                        const sub = window.prompt('Nombre del sub-estado:');
                        if (sub) handleAddSubStatus(sub);
                      }}
                      className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-7 px-3 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingStatus.subStatusList.map((sub, i) => (
                      <div key={i} className="p-3 bg-[#f8f9fa] rounded-md border border-[#e8eaed]">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-[#3b3a3e] text-sm">{sub.subStatus}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSubStatus(sub.subStatus)}
                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="ml-4 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-[#6b6a6e]">Motivos</p>
                            <Button
                              onClick={() => {
                                const reason = window.prompt('Nuevo motivo:');
                                if (reason) handleAddReason(sub.subStatus, reason);
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-[#55c3c5] hover:bg-[#55c3c5]/10"
                            >
                              <Plus className="h-3 w-3 mr-0.5" />
                              Agregar
                            </Button>
                          </div>
                          {sub.reasons.length > 0 ? (
                            <div className="space-y-1">
                              {sub.reasons.map((r, j) => (
                                <div key={j} className="flex items-center justify-between p-1.5 bg-white rounded border border-[#e8eaed] text-xs">
                                  <span className="text-[#3b3a3e]">{r}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveReason(sub.subStatus, r)}
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
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} className="rounded-md h-9 text-sm">
                Cancelar
              </Button>
              <Button onClick={handleSaveStatus} className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-md h-9 text-sm">
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}

interface FieldCardProps {
  field: FormFieldEditable;
  index: number;
  moveField: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (field: FormFieldEditable) => void;
  onDelete: (id: number) => void;
  getComponentIcon: (component: string) => React.ComponentType<{ className?: string }>;
  isDragDisabled?: boolean;
}

function FieldCard({ field, index, moveField, onEdit, onDelete, getComponentIcon, isDragDisabled }: FieldCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'field-card',
    canDrop: () => !isDragDisabled,
    collect: (monitor) => ({ handlerId: monitor.getHandlerId() }),
    drop(item: { index: number }) {
      if (!isDragDisabled && item.index !== index) moveField(item.index, index);
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current || isDragDisabled || item.index === index) return;
      const rect = ref.current.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const client = monitor.getClientOffset();
      if (!client) return;
      if (item.index < index && client.y < midY) return;
      if (item.index > index && client.y > midY) return;
      moveField(item.index, index);
      item.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'field-card',
    item: () => ({ id: field.id, index }),
    canDrag: () => !isDragDisabled,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
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
      <div className="absolute top-3 left-3 w-5 h-5 rounded bg-[#f8f9fa] flex items-center justify-center">
        <span className="text-xs font-medium text-[#6b6a6e]">{index + 1}</span>
      </div>
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => onEdit(field)} className="h-6 w-6 p-0 text-[#55c3c5] hover:bg-[#55c3c5]/10 rounded">
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(field.id)} className="h-6 w-6 p-0 text-[#6b6a6e] hover:text-red-600 hover:bg-red-50 rounded">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <IconComponent className="h-4 w-4 text-[#55c3c5] flex-shrink-0" />
          <h4 className="font-semibold text-[#3b3a3e] text-sm truncate">{field.field.label}</h4>
        </div>
        <p className="text-xs text-[#6b6a6e] mb-3 truncate font-mono">{field.name}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-[#f8f9fa] text-[#6b6a6e] rounded">{field.component}</span>
          {field.field.isRequired && <span className="text-[#55c3c5]">• Requerido</span>}
        </div>
      </div>
    </div>
  );
}
