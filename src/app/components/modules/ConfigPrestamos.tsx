import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApplicationConfig } from '../../hooks/use-application-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Save, Percent, Calendar, DollarSign, TrendingUp, Wallet, Loader2, History, Settings } from 'lucide-react';
import {
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ReferenceLine,
} from 'recharts';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import type {
  ApplicationConfigResponse,
  ApplicationConfigRequest,
  TermConfigItem,
  InvestmentFeeItemBackend,
} from '../../types/dto';
import {
  calculateLoanQuota,
  generateAmortizationData,
  getLoanSummary,
  findInvestmentFeeByAmount,
  investmentFeeAmount,
  getInvestmentSimulation,
  generateInvestmentTimeSeries,
} from '../../services/applicationConfigSimulation';

const DEFAULT_TERM_CONFIG: TermConfigItem[] = [
  { tna: 9.5, name: '1 año', value: 1 },
  { tna: 10.5, name: '2 años', value: 2 },
  { tna: 11.5, name: '3 años', value: 3 },
  { tna: 12.5, name: '4 años', value: 4 },
  { tna: 13.5, name: '5 años', value: 5 },
];

const DEFAULT_INVESTMENT_FEES: InvestmentFeeItemBackend[] = [
  { minAmount: 0, maxAmount: 40000, fee: 1.5 },
  { minAmount: 40000, maxAmount: null, fee: 1 },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

function toFormState(config: ApplicationConfigResponse | null): ApplicationConfigRequest {
  if (!config)
    return {
      bill: 2,
      fee: 1.5,
      maxPropertyPercentage: 80,
      minAmount: 50000,
      minAmountToInvest: 10000,
      iva: 21,
      termConfigs: DEFAULT_TERM_CONFIG,
      investmentFees: DEFAULT_INVESTMENT_FEES,
    };
  return {
    bill: Number(config.bill),
    fee: Number(config.fee),
    maxPropertyPercentage: Number(config.maxPropertyPercentage),
    minAmount: Number(config.minAmount),
    minAmountToInvest: Number(config.minAmountToInvest),
    iva: Number(config.iva),
    termConfigs: Array.isArray(config.termConfigs)
      ? (config.termConfigs as TermConfigItem[]).map((t) => ({
          tna: Number(t.tna),
          name: String(t.name),
          value: Number(t.value),
        }))
      : DEFAULT_TERM_CONFIG,
    investmentFees: Array.isArray(config.investmentFees)
      ? (config.investmentFees as InvestmentFeeItemBackend[]).map((i) => ({
          minAmount: i.minAmount != null ? Number(i.minAmount) : null,
          maxAmount: i.maxAmount != null ? Number(i.maxAmount) : null,
          fee: Number(i.fee),
        }))
      : DEFAULT_INVESTMENT_FEES,
  };
}

export function ConfigPrestamos() {
  const { environment } = useAuth();
  const { getApplicationConfigLast, getApplicationConfigList, createApplicationConfig, hasApi } =
    useApplicationConfig();
  const [config, setConfig] = useState<ApplicationConfigResponse | null>(null);
  const [form, setForm] = useState<ApplicationConfigRequest>(() => toFormState(null));
  const [historyList, setHistoryList] = useState<ApplicationConfigResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [previewAmount, setPreviewAmount] = useState(100000);
  const [previewTermName, setPreviewTermName] = useState('3 años');
  const [simulatorWithIva, setSimulatorWithIva] = useState(true);
  const [simulatorTab, setSimulatorTab] = useState<'loan' | 'investment'>('loan');
  const [investmentPreviewAmount, setInvestmentPreviewAmount] = useState(50000);
  const [investmentPreviewTermName, setInvestmentPreviewTermName] = useState('');

  const loadData = React.useCallback(async () => {
    if (!hasApi) return;
    const [lastRes, listRes] = await Promise.all([
      getApplicationConfigLast(),
      getApplicationConfigList({ page: '0', size: '50' }),
    ]);
    if (lastRes?.data) {
      setConfig(lastRes.data);
      setForm(toFormState(lastRes.data));
      const terms = (lastRes.data.termConfigs as TermConfigItem[]) || [];
      if (terms.length > 0) {
        setPreviewTermName((prev) => prev || terms[0].name);
        setInvestmentPreviewTermName((prev) => prev || terms[0].name);
      }
    }
    if (listRes?.data?.content) setHistoryList(listRes.data.content);
    else setHistoryList([]);
  }, [hasApi, getApplicationConfigLast, getApplicationConfigList]);

  useEffect(() => {
    if (!hasApi) {
      setLoading(false);
      setForm(toFormState(null));
      setHistoryList([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadData().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [hasApi, loadData]);

  const updateForm = (patch: Partial<ApplicationConfigRequest>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    if (!hasApi) {
      toast.error('No hay conexión con el backend');
      return;
    }
    setSaving(true);
    try {
      const res = await createApplicationConfig(form);
      if (res?.code === 200 || res?.code === 201) {
        toast.success('Configuración guardada correctamente');
        await loadData();
      } else {
        toast.error(res?.message ?? 'Error al guardar');
      }
    } catch {
      toast.error('Ocurrió un error');
    } finally {
      setSaving(false);
    }
  };

  const configForSimulation: ApplicationConfigResponse = {
    id: config?.id ?? 0,
    bill: form.bill,
    fee: form.fee,
    maxPropertyPercentage: form.maxPropertyPercentage,
    minAmount: form.minAmount,
    minAmountToInvest: form.minAmountToInvest,
    iva: form.iva,
    termConfigs: form.termConfigs as TermConfigItem[],
    investmentFees: form.investmentFees,
    active: config?.active ?? true,
  };

  const loanSimulatorOptions = { applyIva: simulatorWithIva };
  const loanResult =
    configForSimulation &&
    calculateLoanQuota(configForSimulation, previewAmount, previewTermName, loanSimulatorOptions);
  const amortizationData =
    configForSimulation &&
    loanResult &&
    generateAmortizationData(
      configForSimulation,
      previewAmount,
      previewTermName,
      loanResult.months,
      loanSimulatorOptions
    );
  const loanSummary =
    amortizationData && loanResult
      ? getLoanSummary(amortizationData, loanResult.principal, loanResult.quota, loanResult.months)
      : null;
  const compositionData = amortizationData?.slice(0, 12) ?? [];
  const investmentFeePct =
    configForSimulation &&
    findInvestmentFeeByAmount(configForSimulation, investmentPreviewAmount);
  const investmentFeeValue =
    configForSimulation &&
    investmentFeeAmount(configForSimulation, investmentPreviewAmount);

  const termOptions = form.termConfigs as TermConfigItem[];
  const investmentTermName = (investmentPreviewTermName || termOptions[0]?.name) ?? '';
  const investmentSimulation =
    configForSimulation &&
    investmentTermName &&
    investmentPreviewAmount > 0
      ? getInvestmentSimulation(
          configForSimulation,
          investmentPreviewAmount,
          investmentTermName,
          loanSimulatorOptions
        )
      : null;
  const investmentTimeSeries =
    investmentSimulation
      ? generateInvestmentTimeSeries(investmentSimulation.months, investmentSimulation.quota)
      : [];

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#55c3c5]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl text-[#3b3a3e] font-semibold tracking-tight">
            Variables
          </h1>
          <p className="text-[#6b6a6e] mt-1 text-sm md:text-base">
            Configuración de solicitudes e inversiones ·{' '}
            <span className="text-[#55c3c5] font-medium">
              {environment === 'production' ? 'Producción' : 'Desarrollo'}
            </span>
          </p>
        </div>
        <Badge
          variant="secondary"
          className={
            environment === 'production'
              ? 'bg-[#55c3c5]/15 text-[#55c3c5] border-0 w-fit'
              : 'bg-[#4a494d]/10 text-[#4a494d] border-0 w-fit'
          }
        >
          {environment === 'production' ? 'Producción' : 'Desarrollo'}
        </Badge>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="bg-[#f5f5f6] p-1 rounded-xl h-11">
          <TabsTrigger value="config" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="simulators" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Simuladores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-8 mt-6">
          <section>
            <h2 className="text-sm font-medium text-[#6b6a6e] mb-4">Resumen actual</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-[#e8eaed] bg-white">
                <CardContent className="p-5">
                  <Percent className="h-5 w-5 text-[#55c3c5] mb-2" />
                  <p className="text-2xl font-semibold text-[#3b3a3e]">{form.fee}%</p>
                  <p className="text-sm text-[#6b6a6e] mt-0.5">Fee solicitud</p>
                </CardContent>
              </Card>
              <Card className="border border-[#e8eaed] bg-white">
                <CardContent className="p-5">
                  <Calendar className="h-5 w-5 text-purple-500 mb-2" />
                  <p className="text-2xl font-semibold text-[#3b3a3e]">
                    {termOptions.length ? termOptions[termOptions.length - 1]?.value : '–'} años
                  </p>
                  <p className="text-sm text-[#6b6a6e] mt-0.5">Plazo máximo</p>
                </CardContent>
              </Card>
              <Card className="border border-[#e8eaed] bg-white">
                <CardContent className="p-5">
                  <DollarSign className="h-5 w-5 text-emerald-500 mb-2" />
                  <p className="text-2xl font-semibold text-[#3b3a3e]">
                    ${(form.minAmount / 1000).toFixed(0)}k / ${(form.minAmountToInvest / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-[#6b6a6e] mt-0.5">Mín. préstamo / inversión</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-[#6b6a6e] mb-4">Parámetros generales</h2>
            <Card className="border border-[#e8eaed] bg-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#3b3a3e]">Bill (%)</Label>
                    <Input
                      type="number"
                      value={form.bill}
                      onChange={(e) => updateForm({ bill: Number(e.target.value) })}
                      step="0.1"
                      className="h-10 rounded-lg border-[#e8eaed]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#3b3a3e]">Fee (%)</Label>
                    <Input
                      type="number"
                      value={form.fee}
                      onChange={(e) => updateForm({ fee: Number(e.target.value) })}
                      step="0.1"
                      className="h-10 rounded-lg border-[#e8eaed]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#3b3a3e]">IVA (%)</Label>
                    <Input
                      type="number"
                      value={form.iva}
                      onChange={(e) => updateForm({ iva: Number(e.target.value) })}
                      step="0.1"
                      className="h-10 rounded-lg border-[#e8eaed]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#3b3a3e]">Máx. % propiedad</Label>
                    <Input
                      type="number"
                      value={form.maxPropertyPercentage}
                      onChange={(e) => updateForm({ maxPropertyPercentage: Number(e.target.value) })}
                      className="h-10 rounded-lg border-[#e8eaed]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#3b3a3e]">Mín. préstamo</Label>
                    <Input
                      type="number"
                      value={form.minAmount}
                      onChange={(e) => updateForm({ minAmount: Number(e.target.value) })}
                      className="h-10 rounded-lg border-[#e8eaed]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#3b3a3e]">Mín. inversión</Label>
                    <Input
                      type="number"
                      value={form.minAmountToInvest}
                      onChange={(e) => updateForm({ minAmountToInvest: Number(e.target.value) })}
                      className="h-10 rounded-lg border-[#e8eaed]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-sm font-medium text-[#6b6a6e] mb-4">Plazos (TNA por año)</h2>
            <Card className="border border-[#e8eaed] bg-white">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {termOptions.map((t, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e8eaed] bg-[#fafafa] p-3">
                      <Input
                        placeholder="Nombre (ej. 1 año)"
                        value={t.name}
                        onChange={(e) => {
                          const next = [...termOptions];
                          next[idx] = { ...next[idx], name: e.target.value };
                          updateForm({ termConfigs: next });
                        }}
                        className="flex-1 min-w-[100px] h-9 rounded-lg"
                      />
                      <span className="text-sm text-[#6b6a6e]">años</span>
                      <Input
                        type="number"
                        value={t.value}
                        onChange={(e) => {
                          const next = [...termOptions];
                          next[idx] = { ...next[idx], value: Number(e.target.value) };
                          updateForm({ termConfigs: next });
                        }}
                        className="w-16 h-9 rounded-lg"
                      />
                      <span className="text-sm text-[#6b6a6e]">TNA %</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={t.tna}
                        onChange={(e) => {
                          const next = [...termOptions];
                          next[idx] = { ...next[idx], tna: Number(e.target.value) };
                          updateForm({ termConfigs: next });
                        }}
                        className="w-20 h-9 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-sm font-medium text-[#6b6a6e] mb-4">Comisiones por inversión</h2>
            <Card className="border border-[#e8eaed] bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-[#6b6a6e] mb-4">Rangos por monto: desde, hasta (vacío = sin tope) y fee %.</p>
                <div className="space-y-3">
                  {form.investmentFees.map((i, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e8eaed] bg-[#fafafa] p-3">
                      <Label className="text-sm text-[#6b6a6e] w-12">Desde</Label>
                      <Input
                        type="number"
                        value={i.minAmount ?? ''}
                        onChange={(e) => {
                          const next = [...form.investmentFees];
                          next[idx] = { ...next[idx], minAmount: e.target.value === '' ? null : Number(e.target.value) };
                          updateForm({ investmentFees: next });
                        }}
                        className="w-28 h-9 rounded-lg"
                      />
                      <Label className="text-sm text-[#6b6a6e] w-12">Hasta</Label>
                      <Input
                        type="number"
                        placeholder="Sin tope"
                        value={i.maxAmount ?? ''}
                        onChange={(e) => {
                          const next = [...form.investmentFees];
                          next[idx] = { ...next[idx], maxAmount: e.target.value === '' ? null : Number(e.target.value) };
                          updateForm({ investmentFees: next });
                        }}
                        className="w-28 h-9 rounded-lg"
                      />
                      <Label className="text-sm text-[#6b6a6e] w-10">Fee %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={i.fee}
                        onChange={(e) => {
                          const next = [...form.investmentFees];
                          next[idx] = { ...next[idx], fee: Number(e.target.value) };
                          updateForm({ investmentFees: next });
                        }}
                        className="w-20 h-9 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <Button
            onClick={handleSave}
            disabled={saving || !hasApi}
            className="w-full sm:w-auto min-w-[200px] h-11 bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-xl font-medium"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar configuración
          </Button>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="border border-[#e8eaed] bg-white">
            <CardHeader className="border-b border-[#e8eaed]">
              <CardTitle className="text-base font-semibold text-[#3b3a3e]">Histórico de configuraciones</CardTitle>
              <CardDescription className="text-sm text-[#6b6a6e]">Listado desde el backend (última arriba)</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {historyList.length === 0 ? (
                <p className="text-[#6b6a6e] py-8 text-center">No hay configuraciones en el historial.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[#6b6a6e] font-medium">ID</TableHead>
                      <TableHead className="text-[#6b6a6e] font-medium">Activa</TableHead>
                      <TableHead className="text-[#6b6a6e] font-medium">Bill %</TableHead>
                      <TableHead className="text-[#6b6a6e] font-medium">Fee %</TableHead>
                      <TableHead className="text-[#6b6a6e] font-medium">IVA %</TableHead>
                      <TableHead className="text-[#6b6a6e] font-medium">Mín. préstamo</TableHead>
                      <TableHead className="text-[#6b6a6e] font-medium">Mín. inversión</TableHead>
                      <TableHead className="text-[#6b6a6e] font-medium">Plazos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyList.map((row) => {
                      const terms = Array.isArray(row.termConfigs) ? row.termConfigs as TermConfigItem[] : [];
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.id}</TableCell>
                          <TableCell>
                            {row.active ? (
                              <Badge className="bg-emerald-500/20 text-emerald-700 border-0 text-xs">Sí</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>{Number(row.bill)}</TableCell>
                          <TableCell>{Number(row.fee)}</TableCell>
                          <TableCell>{Number(row.iva)}</TableCell>
                          <TableCell>${Number(row.minAmount).toLocaleString()}</TableCell>
                          <TableCell>${Number(row.minAmountToInvest).toLocaleString()}</TableCell>
                          <TableCell>{terms.length} plazos</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulators" className="mt-6">
          <Card className="border border-[#e8eaed] bg-white">
            <CardHeader className="border-b border-[#e8eaed]">
              <CardTitle className="text-base font-semibold text-[#3b3a3e]">Simuladores</CardTitle>
              <CardDescription className="text-sm text-[#6b6a6e]">
                Validar la configuración de préstamos e inversiones antes de publicar. Podés simular con o sin IVA aplicado a fee y gastos.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-2 mb-6">
            <Button
              variant={simulatorTab === 'loan' ? 'default' : 'outline'}
              onClick={() => setSimulatorTab('loan')}
              className={simulatorTab === 'loan' ? 'bg-[#55c3c5] hover:bg-[#3db3b5]' : ''}
            >
              Préstamo
            </Button>
            <Button
              variant={simulatorTab === 'investment' ? 'default' : 'outline'}
              onClick={() => setSimulatorTab('investment')}
              className={simulatorTab === 'investment' ? 'bg-[#55c3c5] hover:bg-[#3db3b5]' : ''}
            >
              Inversión
            </Button>
              </div>

              {simulatorTab === 'loan' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#3b3a3e]">Monto del préstamo</Label>
                    <Input
                      type="number"
                      value={previewAmount}
                      onChange={(e) => setPreviewAmount(Number(e.target.value))}
                      className="h-11 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#3b3a3e]">Plazo</Label>
                    <select
                      value={previewTermName}
                      onChange={(e) => setPreviewTermName(e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-[#e8eaed] bg-white px-3 text-sm"
                    >
                      {termOptions.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} (TNA {t.tna}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#e8eaed] bg-[#fafafa] px-4 py-3">
                    <div>
                      <Label htmlFor="sim-iva" className="text-sm font-medium text-[#3b3a3e] cursor-pointer">
                        Incluir IVA en fee y gastos
                      </Label>
                      <p className="text-xs text-[#6b6a6e] mt-0.5">
                        Según BE: fee y bill se multiplican por (1 + IVA). Desactivar para simular sin IVA.
                      </p>
                    </div>
                    <Switch
                      id="sim-iva"
                      checked={simulatorWithIva}
                      onCheckedChange={setSimulatorWithIva}
                      className="data-[state=checked]:bg-[#55c3c5]"
                    />
                  </div>
                </div>
                {loanResult && loanSummary && (
                  <div className="rounded-xl border border-[#e8eaed] bg-[#fafafa] p-5 grid grid-cols-2 gap-4">
                    {!simulatorWithIva && (
                      <div className="col-span-2">
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-0">
                          Simulando sin IVA (fee y gastos sin IVA)
                        </Badge>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-[#6b6a6e] uppercase tracking-wider">Cuota mensual</p>
                      <p className="text-xl font-semibold text-[#55c3c5] mt-0.5">{formatCurrency(loanResult.quota)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#6b6a6e] uppercase tracking-wider">Plazo</p>
                      <p className="text-xl font-semibold text-[#3b3a3e] mt-0.5">{loanResult.months} meses</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#6b6a6e] uppercase tracking-wider">Total a pagar</p>
                      <p className="text-xl font-semibold text-[#3b3a3e] mt-0.5">{formatCurrency(loanSummary.totalPayed)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#6b6a6e] uppercase tracking-wider">Total intereses</p>
                      <p className="text-xl font-semibold text-[#ef4444] mt-0.5">{formatCurrency(loanSummary.totalInterest)}</p>
                    </div>
                  </div>
                )}
              </div>

              {amortizationData && amortizationData.length > 0 && (
                <>
                  <div className="rounded-xl border border-[#e8eaed] bg-white p-5">
                    <h3 className="text-sm font-semibold text-[#3b3a3e] mb-1">Evolución del saldo de la deuda</h3>
                    <p className="text-xs text-[#6b6a6e] mb-4">Para validar la configuración: saldo restante mes a mes según plazo y TNA elegidos</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart
                        data={amortizationData}
                        margin={{ top: 10, right: 16, left: 8, bottom: 24 }}
                      >
                        <defs>
                          <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#55c3c5" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#55c3c5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                        <XAxis
                          dataKey="mes"
                          tick={{ fill: '#6b6a6e', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#e8eaed' }}
                          tickFormatter={(v) => {
                            const n = Number(v);
                            if (n === 1) return 'Mes 1';
                            if (amortizationData.length > 24 && n % 12 === 0) return `Año ${n / 12}`;
                            if (amortizationData.length <= 24) return n;
                            return '';
                          }}
                          interval={amortizationData.length > 18 ? Math.floor(amortizationData.length / 6) : 0}
                        />
                        <YAxis
                          tick={{ fill: '#6b6a6e', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k'}`}
                          width={48}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const row = amortizationData?.find((d) => d.mes === label);
                            if (!row) return null;
                            return (
                              <div className="rounded-lg border border-[#e8eaed] bg-white px-4 py-3 shadow-md">
                                <p className="text-xs font-semibold text-[#6b6a6e] mb-2">Mes {label}</p>
                                <p className="text-sm">
                                  <span className="text-[#6b6a6e]">Saldo restante: </span>
                                  <span className="font-semibold text-[#3b3a3e]">{formatCurrency(row.saldo)}</span>
                                </p>
                                <p className="text-xs text-[#6b6a6e] mt-1">
                                  Cuota: {formatCurrency(row.cuota)} (capital {formatCurrency(row.capital)} + interés {formatCurrency(row.interes)})
                                </p>
                              </div>
                            );
                          }}
                          cursor={{ stroke: '#55c3c5', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="saldo"
                          name="Saldo restante"
                          stroke="#55c3c5"
                          strokeWidth={2.5}
                          fill="url(#saldoGradient)"
                          dot={false}
                          activeDot={{ r: 4, fill: '#55c3c5', stroke: 'white', strokeWidth: 2 }}
                        />
                        <ReferenceLine y={0} stroke="#e8eaed" strokeDasharray="2 2" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {compositionData.length > 0 && (
                    <div className="rounded-xl border border-[#e8eaed] bg-white p-5">
                      <h3 className="text-sm font-semibold text-[#3b3a3e] mb-1">Composición de la cuota (primeros meses)</h3>
                      <p className="text-xs text-[#6b6a6e] mb-4">Desglose capital vs interés por mes para revisar el comportamiento de la amortización</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={compositionData}
                          margin={{ top: 10, right: 16, left: 8, bottom: 24 }}
                          barCategoryGap="12%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                          <XAxis
                            dataKey="mes"
                            tick={{ fill: '#6b6a6e', fontSize: 11 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e8eaed' }}
                            label={{ value: 'Mes', position: 'insideBottom', offset: -8, fill: '#6b6a6e', fontSize: 11 }}
                          />
                          <YAxis
                            tick={{ fill: '#6b6a6e', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            width={44}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const row = compositionData.find((d) => d.mes === label);
                              if (!row) return null;
                              return (
                                <div className="rounded-lg border border-[#e8eaed] bg-white px-4 py-3 shadow-md">
                                  <p className="text-xs font-semibold text-[#6b6a6e] mb-2">Mes {label}</p>
                                  <p className="text-sm flex justify-between gap-4">
                                    <span className="text-[#6b6a6e]">Capital:</span>
                                    <span className="font-medium text-[#55c3c5]">{formatCurrency(row.capital)}</span>
                                  </p>
                                  <p className="text-sm flex justify-between gap-4">
                                    <span className="text-[#6b6a6e]">Interés:</span>
                                    <span className="font-medium text-[#ef4444]">{formatCurrency(row.interes)}</span>
                                  </p>
                                  <p className="text-xs text-[#6b6a6e] mt-1 pt-1 border-t border-[#e8eaed]">
                                    Cuota total: {formatCurrency(row.cuota)}
                                  </p>
                                </div>
                              );
                            }}
                            cursor={{ fill: '#f5f5f6' }}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: 8 }}
                            formatter={(value) => <span className="text-xs text-[#6b6a6e]">{value}</span>}
                            iconType="square"
                            iconSize={10}
                          />
                          <Bar dataKey="capital" name="Capital (amortización)" stackId="a" fill="#55c3c5" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="interes" name="Interés" stackId="a" fill="#f87171" radius={[0, 0, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
              )}

              {simulatorTab === 'investment' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#3b3a3e]">Monto a invertir</Label>
                  <Input
                    type="number"
                    value={investmentPreviewAmount}
                    onChange={(e) => setInvestmentPreviewAmount(Number(e.target.value))}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#3b3a3e]">Plazo</Label>
                  <select
                    value={investmentPreviewTermName || (termOptions[0]?.name ?? '')}
                    onChange={(e) => setInvestmentPreviewTermName(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-[#e8eaed] bg-white px-3 text-sm"
                  >
                    {termOptions.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-[#55c3c5]/20 bg-[#55c3c5]/5 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-8 w-8 text-[#55c3c5]" />
                    <div>
                      {(investmentPreviewTermName || termOptions[0]?.name) && (
                        <p className="text-xs text-[#6b6a6e] mb-1">
                          Plazo: <strong className="text-[#3b3a3e]">{investmentPreviewTermName || termOptions[0]?.name}</strong>
                        </p>
                      )}
                      {investmentSimulation && (
                        <p className="text-xs text-[#6b6a6e] mb-1">
                          TNA: <strong className="text-[#3b3a3e]">{investmentSimulation.tna.toFixed(2)}%</strong>
                          {' · '}
                          TEM: <strong className="text-[#3b3a3e]">{(investmentSimulation.tem * 100).toFixed(4)}%</strong>
                          {' · '}
                          {investmentSimulation.months} meses
                        </p>
                      )}
                      {investmentSimulation && (
                        <p className="text-xs text-[#6b6a6e] mb-1">
                          Cuota mensual que recibe: <strong className="text-[#55c3c5]">{formatCurrency(investmentSimulation.quota)}</strong>
                          {' · '}
                          Total esperado: <strong className="text-[#3b3a3e]">{formatCurrency(investmentSimulation.totalExpectedToPay)}</strong>
                        </p>
                      )}
                      {investmentFeePct != null ? (
                        <>
                          <p className="text-sm text-[#6b6a6e]">
                            Comisión aplicada: <strong className="text-[#3b3a3e]">{investmentFeePct}%</strong>
                          </p>
                          <p className="text-2xl font-semibold text-[#55c3c5]">
                            {investmentFeeValue != null ? formatCurrency(investmentFeeValue) : '$0'} por comisión
                          </p>
                          <p className="text-xs text-[#6b6a6e] mt-1">
                            Neto a invertir: {formatCurrency(investmentPreviewAmount - (investmentFeeValue ?? 0))}
                          </p>
                        </>
                      ) : (
                        <p className="text-[#6b6a6e]">
                          No hay rango de comisión para este monto en la configuración actual.
                        </p>
                      )}
                    </div>
                  </div>
                  {investmentFeePct != null && investmentFeeValue != null && investmentPreviewAmount > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#6b6a6e] uppercase tracking-wider">
                        Desglose del monto
                      </p>
                      <div className="h-8 w-full rounded-lg overflow-hidden flex bg-[#e8eaed]">
                        <div
                          className="h-full bg-[#55c3c5]/80 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, ((investmentPreviewAmount - investmentFeeValue) / investmentPreviewAmount) * 100)}%`,
                          }}
                          title="Neto a invertir"
                        />
                        <div
                          className="h-full bg-[#ef4444]/60 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (investmentFeeValue / investmentPreviewAmount) * 100)}%`,
                          }}
                          title="Comisión"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[#6b6a6e]">
                        <span>Inversión neta</span>
                        <span>Comisión ({investmentFeePct}%)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                {investmentTimeSeries.length > 0 && (
                  <div className="rounded-xl border border-[#e8eaed] bg-white p-5">
                    <h3 className="text-sm font-semibold text-[#3b3a3e] mb-1">Flujo de cobros en el tiempo</h3>
                    <p className="text-xs text-[#6b6a6e] mb-4">
                      Cuota mensual que recibe el inversor y total acumulado según el plazo y TEM configurados
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart
                        data={investmentTimeSeries}
                        margin={{ top: 10, right: 16, left: 8, bottom: 24 }}
                      >
                        <defs>
                          <linearGradient id="cobroGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#55c3c5" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#55c3c5" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                        <XAxis
                          dataKey="mes"
                          tick={{ fill: '#6b6a6e', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#e8eaed' }}
                          label={{ value: 'Mes', position: 'insideBottom', offset: -8, fill: '#6b6a6e', fontSize: 11 }}
                          interval={Math.max(0, Math.floor(investmentTimeSeries.length / 12))}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: '#6b6a6e', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          width={44}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: '#6b6a6e', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          width={44}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length || !label) return null;
                            const row = investmentTimeSeries.find((d) => d.mes === label);
                            if (!row) return null;
                            return (
                              <div className="rounded-lg border border-[#e8eaed] bg-white px-4 py-3 shadow-md">
                                <p className="text-xs font-semibold text-[#6b6a6e] mb-2">Mes {label}</p>
                                <p className="text-sm flex justify-between gap-4">
                                  <span className="text-[#6b6a6e]">Cobro:</span>
                                  <span className="font-medium text-[#55c3c5]">{formatCurrency(row.cobro)}</span>
                                </p>
                                <p className="text-sm flex justify-between gap-4">
                                  <span className="text-[#6b6a6e]">Acumulado:</span>
                                  <span className="font-medium text-[#3b3a3e]">{formatCurrency(row.acumulado)}</span>
                                </p>
                              </div>
                            );
                          }}
                          cursor={{ stroke: '#55c3c5', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: 8 }}
                          formatter={(value) => <span className="text-xs text-[#6b6a6e]">{value}</span>}
                          iconType="square"
                          iconSize={10}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="cobro"
                          name="Cobro mensual"
                          fill="#55c3c5"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={24}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="acumulado"
                          name="Acumulado"
                          stroke="#0d9488"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: '#0d9488', stroke: 'white', strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="min-h-[120px] flex items-center justify-center rounded-xl border border-[#e8eaed] bg-[#fafafa] p-6">
                  {investmentFeePct != null && configForSimulation && (
                    <div className="w-full max-w-sm space-y-4">
                      <p className="text-sm font-medium text-[#6b6a6e] text-center">
                        Tu monto está en el rango con comisión del <strong className="text-[#55c3c5]">{investmentFeePct}%</strong>
                      </p>
                      <div className="flex flex-col gap-2">
                        {(configForSimulation.investmentFees as InvestmentFeeItemBackend[])
                          .sort((a, b) => (a.minAmount ?? 0) - (b.minAmount ?? 0))
                          .map((tier, idx) => {
                            const isActive = findInvestmentFeeByAmount(configForSimulation, investmentPreviewAmount) === tier.fee;
                            return (
                              <div
                                key={idx}
                                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                                  isActive
                                    ? 'border-[#55c3c5] bg-[#55c3c5]/10'
                                    : 'border-[#e8eaed] bg-white'
                                }`}
                              >
                                <span className="text-[#6b6a6e]">
                                  {tier.minAmount != null ? formatCurrency(tier.minAmount) : '$0'} –{' '}
                                  {tier.maxAmount != null ? formatCurrency(tier.maxAmount) : 'sin tope'}
                                </span>
                                <span className="font-semibold text-[#3b3a3e]">{tier.fee}%</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
