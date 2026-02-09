import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Plus, ListTodo, ArrowRight, Zap, Loader2, GitBranch, ChevronRight, FileText } from 'lucide-react';
import { useTaskConfig } from '../../hooks/use-task-config';
import type { TaskConfigActionsResponse, ActionItemWithDependenciesResponse } from '../../services/api';

interface TareasListaProps {
  onSelectTarea: (tareaId: string) => void;
  onCreateTarea: () => void;
  onOpenFormulario?: (taskTypeId: number, taskTypeName: string) => void;
}

interface TaskTypeItem {
  id: number;
  name: string;
}

interface LastConfig {
  taskConfigId: number;
  taskName: string;
}

type DetailState = { lastConfig: LastConfig; actions: TaskConfigActionsResponse } | 'loading' | null;

export function TareasLista({ onSelectTarea, onCreateTarea, onOpenFormulario }: TareasListaProps) {
  const taskConfigApi = useTaskConfig();
  const [taskTypes, setTaskTypes] = useState<TaskTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTaskTypeId, setExpandedTaskTypeId] = useState<number | null>(null);
  const [detailByTaskTypeId, setDetailByTaskTypeId] = useState<Record<number, DetailState>>({});
  const loadedDetailIdsRef = useRef<Set<number>>(new Set());

  const loadTaskTypes = useCallback(async () => {
    if (!taskConfigApi.hasApi) return;
    setLoading(true);
    setError(null);
    try {
      const res = await taskConfigApi.getTaskTypes({ page: '0', size: '200' });
      if (res.data?.content) {
        const list: TaskTypeItem[] = [];
        for (const row of res.data.content) {
          const id = row.id ?? row.Id;
          const name = row.name ?? row.Name ?? '';
          if (id != null && name) {
            const numId = typeof id === 'number' ? id : Number(id);
            if (!Number.isNaN(numId)) list.push({ id: numId, name: String(name) });
          }
        }
        setTaskTypes(list);
      } else {
        setTaskTypes([]);
      }
    } catch {
      setError('No se pudo cargar la lista de tipos de tarea.');
      setTaskTypes([]);
    } finally {
      setLoading(false);
    }
  }, [taskConfigApi.hasApi]);

  useEffect(() => {
    loadTaskTypes();
  }, [loadTaskTypes]);

  const openDetail = useCallback(
    async (taskTypeId: number) => {
      if (!taskConfigApi.hasApi) return;
      const isSameExpanded = expandedTaskTypeId === taskTypeId;
      const alreadyLoaded = loadedDetailIdsRef.current.has(taskTypeId);

      if (alreadyLoaded && isSameExpanded) {
        setExpandedTaskTypeId(null);
        return;
      }
      setExpandedTaskTypeId(taskTypeId);
      if (alreadyLoaded) return;

      setDetailByTaskTypeId((prev) => ({ ...prev, [taskTypeId]: 'loading' }));

      try {
        const formRes = await taskConfigApi.getFormByTaskTypeId(taskTypeId);
        const taskConfigId = formRes?.data?.taskConfigId;
        const taskName = formRes?.data?.taskName;

        if (taskConfigId == null || taskName == null) {
          setDetailByTaskTypeId((prev) => ({ ...prev, [taskTypeId]: null }));
          return;
        }

        const actionsRes = await taskConfigApi.getTaskConfigActions(taskConfigId);
        if (!actionsRes?.data) {
          setDetailByTaskTypeId((prev) => ({ ...prev, [taskTypeId]: null }));
          return;
        }

        loadedDetailIdsRef.current.add(taskTypeId);
        setDetailByTaskTypeId((prev) => ({
          ...prev,
          [taskTypeId]: {
            lastConfig: { taskConfigId, taskName },
            actions: actionsRes.data,
          },
        }));
      } catch {
        setDetailByTaskTypeId((prev) => ({ ...prev, [taskTypeId]: null }));
      }
    },
    [taskConfigApi, expandedTaskTypeId]
  );

  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [sheetContent, setSheetContent] = useState<{
    taskTypeName: string;
    taskConfigId: number;
    actions: TaskConfigActionsResponse;
  } | null>(null);

  const openActionsSheet = useCallback((taskTypeName: string, taskConfigId: number, actions: TaskConfigActionsResponse) => {
    setSheetContent({ taskTypeName, taskConfigId, actions });
    setActionsSheetOpen(true);
  }, []);

  return (
    <div className="p-6 md:p-10 space-y-8 md:space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl text-[#3b3a3e] mb-2 tracking-tight font-semibold">Tareas</h1>
          <p className="text-[#6b6a6e] text-base">
            Listá los tipos de tarea; al entrar al detalle se carga la última TaskConfig y el grafo de acciones.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        <Card className="border border-[#e8eaed] hover:border-[#55c3c5]/50 transition-all overflow-hidden relative">
          <CardContent className="p-7 md:p-8">
            <div className="p-4 rounded-xl bg-[#55c3c5]/10 w-fit mb-4">
              <ListTodo className="h-6 w-6 md:h-7 md:w-7 text-[#55c3c5]" />
            </div>
            <div className="text-4xl md:text-5xl font-semibold text-[#3b3a3e] mb-3 tracking-tight">
              {taskTypes.length}
            </div>
            <p className="text-sm md:text-base text-[#6b6a6e] font-medium">Tipos de tarea</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
        <CardHeader className="border-b border-[#e8eaed] pb-6 px-6 md:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#55c3c5]/10">
              <ListTodo className="h-6 w-6 text-[#55c3c5]" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl text-[#3b3a3e] tracking-tight">
                Tipos de tarea
              </CardTitle>
              <p className="text-sm text-[#6b6a6e] mt-1">
                Entrá al detalle de uno para cargar su última TaskConfig y el grafo de acciones (estilo ramas git).
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[#6b6a6e]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Cargando tipos de tarea…</span>
            </div>
          ) : (
            <div className="space-y-3">
              {taskTypes.map((tt) => {
                const isExpanded = expandedTaskTypeId === tt.id;
                const detail = detailByTaskTypeId[tt.id];
                const isLoading = detail === 'loading';
                const hasDetail = detail != null && detail !== 'loading';

                return (
                  <Card
                    key={tt.id}
                    className="border border-[#e8eaed] hover:border-[#55c3c5]/40 transition-all overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <button
                        type="button"
                        onClick={() => openDetail(tt.id)}
                        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left hover:bg-[#f8f9fa]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#55c3c5]/10 text-[#55c3c5] font-semibold text-sm">
                            {tt.id}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#3b3a3e] text-lg">{tt.name}</h3>
                            <p className="text-xs text-[#6b6a6e] mt-0.5">Tipo de tarea · clic para ver detalle</p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-5 w-5 text-[#6b6a6e] shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#e8eaed] bg-[#f8f9fa]/30 p-5 md:p-6">
                          {isLoading && (
                            <div className="flex items-center gap-2 text-[#6b6a6e] py-4">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Cargando última TaskConfig y acciones…</span>
                            </div>
                          )}
                          {!isLoading && !hasDetail && (
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-sm text-[#9b9a9e]">Sin configuración para este tipo.</p>
                              {onOpenFormulario && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => onOpenFormulario(tt.id, tt.name)}
                                  className="bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-lg h-9 px-3 text-sm"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Formulario
                                </Button>
                              )}
                            </div>
                          )}
                          {!isLoading && hasDetail && (
                            <div className="space-y-5">
                              <div>
                                <p className="text-xs font-medium text-[#6b6a6e] uppercase tracking-wide mb-2">
                                  Última configuración (TaskConfig)
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="rounded-lg bg-white px-3 py-2 border border-[#e8eaed] shadow-sm">
                                    <span className="font-medium text-[#3b3a3e]">{detail.lastConfig.taskName}</span>
                                  </div>
                                  <Badge variant="secondary" className="bg-[#55c3c5]/10 text-[#55c3c5] border-[#55c3c5]/20">
                                    TaskConfig #{detail.lastConfig.taskConfigId}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-[#6b6a6e] uppercase tracking-wide mb-2">
                                  Grafo de acciones
                                </p>
                                <div className="rounded-xl border border-[#e8eaed] bg-white p-4">
                                  <GitBranchGraph actions={detail.actions.actions} />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openActionsSheet(tt.name, detail.lastConfig.taskConfigId, detail.actions)}
                                  className="mt-3 hover:bg-[#55c3c5]/10 hover:text-[#55c3c5] rounded-lg h-9 px-3 text-sm"
                                >
                                  <Zap className="mr-2 h-4 w-4" />
                                  Abrir grafo en pantalla completa
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                {onOpenFormulario && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => onOpenFormulario(tt.id, tt.name)}
                                    className="mt-3 bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-lg h-9 px-3 text-sm"
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Formulario
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {taskTypes.length === 0 && !loading && (
                <div className="py-12 text-center text-[#6b6a6e] text-sm">
                  No hay tipos de tarea.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={actionsSheetOpen} onOpenChange={setActionsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-[#55c3c5]" />
              Grafo de acciones (ramas)
            </SheetTitle>
          </SheetHeader>
          {sheetContent && (
            <>
              <p className="text-sm text-[#6b6a6e] mt-1">
                {sheetContent.taskTypeName} · TaskConfig #{sheetContent.taskConfigId}
              </p>
              <div className="mt-6">
                <GitBranchGraph actions={sheetContent.actions.actions} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const ROW_HEIGHT = 52;
const NODE_RADIUS = 10;
const TRUNK_X = 24;

function GitBranchGraph({ actions }: { actions: ActionItemWithDependenciesResponse[] }) {
  const markerId = useId().replace(/:/g, '-');
  const byId = new Map(actions.map((a) => [a.actionItemId, a]));
  const getName = (id: number) => byId.get(id)?.actionName ?? `#${id}`;

  const order = topologicalOrder(actions);
  const indexById = new Map(order.map((id, i) => [id, i]));

  const getY = (actionItemId: number) => {
    const i = indexById.get(actionItemId) ?? 0;
    return i * ROW_HEIGHT + ROW_HEIGHT / 2;
  };

  const edges: { fromId: number; toId: number }[] = [];
  actions.forEach((a) => {
    a.dependencyActionItemIds.forEach((depId) => {
      edges.push({ fromId: depId, toId: a.actionItemId });
    });
  });

  const height = Math.max(order.length * ROW_HEIGHT, 80);
  const graphColumnWidth = 88;

  return (
    <div
      className="flex min-w-0 rounded-lg border border-[#e8eaed] bg-[#fafbfc]/50 overflow-hidden"
      style={{ minHeight: height }}
    >
      {/* Columna fija del grafo: ocupa espacio en el flujo para no pisar el texto */}
      <div className="flex-shrink-0 flex flex-col items-center py-2 border-r border-[#e8eaed] bg-white/80" style={{ width: graphColumnWidth }}>
        <svg
          className="pointer-events-none flex-shrink-0"
          width={graphColumnWidth}
          height={height}
          style={{ overflow: 'visible' }}
        >
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#55c3c5" opacity="0.8" />
          </marker>
        </defs>
        {order.length > 0 && (
          <line
            x1={TRUNK_X}
            y1={NODE_RADIUS}
            x2={TRUNK_X}
            y2={height - NODE_RADIUS}
            stroke="#55c3c5"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.5"
          />
        )}
        {edges.map(({ fromId, toId }) => {
          const fromY = getY(fromId);
          const toY = getY(toId);
          const branchWidth = 44;
          const path = `M ${TRUNK_X} ${fromY} H ${TRUNK_X + branchWidth} V ${toY} H ${TRUNK_X}`;
          return (
            <path
              key={`${fromId}-${toId}`}
              d={path}
              fill="none"
              stroke="#55c3c5"
              strokeWidth="1.5"
              opacity="0.7"
              markerEnd={`url(#${markerId})`}
            />
          );
        })}
        {order.map((actionItemId) => {
          const y = getY(actionItemId);
          return (
            <circle
              key={actionItemId}
              cx={TRUNK_X}
              cy={y}
              r={NODE_RADIUS}
              fill="white"
              stroke="#55c3c5"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      </div>
      {/* Columna de etiquetas: siempre a la derecha del grafo, sin solapamiento */}
      <div className="flex flex-col flex-1 min-w-0 py-2 pl-4 pr-3">
        {order.map((actionItemId) => {
          const action = byId.get(actionItemId);
          if (!action) return null;
          const name = action.actionName ?? `#${action.actionId}`;
          const deps = action.dependencyActionItemIds;

          return (
            <div
              key={actionItemId}
              className="flex items-center gap-3 min-h-[52px] py-2"
              style={{ minHeight: ROW_HEIGHT }}
            >
              <div className="flex-1 min-w-0 rounded-md border border-[#e8eaed] bg-white px-3 py-2 shadow-sm hover:border-[#55c3c5]/40 transition-colors">
                <div className="font-medium text-[#3b3a3e] text-sm truncate">{name}</div>
                {deps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] text-[#6b6a6e]">←</span>
                    {deps.map((depId) => (
                      <span
                        key={depId}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[#55c3c5]/10 text-[#55c3c5]"
                      >
                        {getName(depId)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function topologicalOrder(actions: ActionItemWithDependenciesResponse[]): number[] {
  const byId = new Map(actions.map((a) => [a.actionItemId, a]));
  const inDegree = new Map<number, number>();
  actions.forEach((a) => {
    const depsInGraph = a.dependencyActionItemIds.filter((id) => byId.has(id)).length;
    inDegree.set(a.actionItemId, depsInGraph);
  });
  const queue = actions.filter((a) => inDegree.get(a.actionItemId) === 0).map((a) => a.actionItemId);
  const order: number[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    actions.forEach((a) => {
      if (a.dependencyActionItemIds.includes(id)) {
        const newDeg = (inDegree.get(a.actionItemId) ?? 1) - 1;
        inDegree.set(a.actionItemId, newDeg);
        if (newDeg === 0) queue.push(a.actionItemId);
      }
    });
  }
  const remaining = actions.map((a) => a.actionItemId).filter((i) => !order.includes(i));
  return [...order, ...remaining];
}
