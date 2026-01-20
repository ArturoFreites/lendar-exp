import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Save, Percent, Calendar, DollarSign, Settings, TrendingUp, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';

interface ConfigPrestamo {
  tasaInteres: number;
  plazoMinimo: number;
  plazoMaximo: number;
  montoMinimo: number;
  montoMaximo: number;
  comisionApertura: number;
  tasaMora: number;
  diasGracia: number;
  periodoCapitalizacion: 'mensual' | 'trimestral' | 'anual';
}

const initialConfigDev: ConfigPrestamo = {
  tasaInteres: 12.5,
  plazoMinimo: 3,
  plazoMaximo: 60,
  montoMinimo: 5000,
  montoMaximo: 500000,
  comisionApertura: 2.5,
  tasaMora: 3.0,
  diasGracia: 5,
  periodoCapitalizacion: 'mensual',
};

const initialConfigProd: ConfigPrestamo = {
  tasaInteres: 15.0,
  plazoMinimo: 6,
  plazoMaximo: 48,
  montoMinimo: 10000,
  montoMaximo: 300000,
  comisionApertura: 3.0,
  tasaMora: 4.5,
  diasGracia: 3,
  periodoCapitalizacion: 'mensual',
};

export function ConfigPrestamos() {
  const { environment } = useAuth();
  const [configDev, setConfigDev] = useState<ConfigPrestamo>(initialConfigDev);
  const [configProd, setConfigProd] = useState<ConfigPrestamo>(initialConfigProd);
  const [previewAmount, setPreviewAmount] = useState(100000);
  const [previewTerm, setPreviewTerm] = useState(12);

  // Obtener la configuración actual según el entorno
  const currentConfig = environment === 'production' ? configProd : configDev;
  const setCurrentConfig = environment === 'production' ? setConfigProd : setConfigDev;

  const updateConfig = (field: keyof ConfigPrestamo, value: any) => {
    setCurrentConfig({ ...currentConfig, [field]: value });
  };

  const handleSave = () => {
    console.log(`Saving ${environment} config:`, currentConfig);
    toast.success(`Variables de ${environment === 'production' ? 'producción' : 'desarrollo'} guardadas correctamente`);
  };

  const calcularCuota = (config: ConfigPrestamo, monto: number, plazo: number) => {
    const tasaMensual = config.tasaInteres / 100 / 12;
    const cuota = (monto * tasaMensual * Math.pow(1 + tasaMensual, plazo)) /
                  (Math.pow(1 + tasaMensual, plazo) - 1);
    return cuota;
  };

  const generateAmortizationData = (config: ConfigPrestamo) => {
    const data = [];
    for (let i = 1; i <= Math.min(previewTerm, 24); i++) {
      const cuota = calcularCuota(config, previewAmount, previewTerm);
      const tasaMensual = config.tasaInteres / 100 / 12;
      const saldoInicial = previewAmount - (cuota - previewAmount * tasaMensual) * (i - 1);
      const interes = saldoInicial * tasaMensual;
      const capital = cuota - interes;
      
      data.push({
        mes: i,
        capital: capital,
        interes: interes,
        saldo: Math.max(0, saldoInicial - capital),
      });
    }
    return data;
  };

  const ConfigurationForm = ({ 
    config, 
    environment 
  }: { 
    config: ConfigPrestamo; 
    environment: 'dev' | 'prod' 
  }) => (
    <div className="space-y-6">
      {/* Tasas e Intereses */}
      <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
        <CardHeader className="border-b border-[#e8eaed] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#55c3c5]/10">
              <Percent className="h-6 w-6 text-[#55c3c5]" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Tasas e Intereses</CardTitle>
              <CardDescription className="text-[#6b6a6e] mt-1">Configuración de tasas aplicables</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-[#3b3a3e]">Tasa de Interés Anual</Label>
              <span className="text-2xl font-semibold text-[#55c3c5]">{config.tasaInteres}%</span>
            </div>
            <Slider
              value={[config.tasaInteres]}
              onValueChange={([value]) => updateConfig('tasaInteres', value)}
              min={5}
              max={30}
              step={0.5}
              className="[&_[role=slider]]:bg-[#55c3c5] [&_[role=slider]]:border-[#55c3c5]"
            />
            <div className="flex justify-between text-xs text-[#6b6a6e]">
              <span>5%</span>
              <span>30%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#6b6a6e] uppercase tracking-wider font-semibold">Comisión por Apertura (%)</Label>
              <Input
                type="number"
                value={config.comisionApertura}
                onChange={(e) => updateConfig('comisionApertura', parseFloat(e.target.value))}
                step="0.1"
                className="border-[#e8eaed] focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b6a6e] uppercase tracking-wider font-semibold">Tasa por Mora (%)</Label>
              <Input
                type="number"
                value={config.tasaMora}
                onChange={(e) => updateConfig('tasaMora', parseFloat(e.target.value))}
                step="0.1"
                className="border-[#e8eaed] focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plazos y Períodos */}
      <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
        <CardHeader className="border-b border-[#e8eaed] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Plazos y Períodos</CardTitle>
              <CardDescription className="text-[#6b6a6e] mt-1">Configuración de términos temporales</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#6b6a6e] uppercase tracking-wider font-semibold">Plazo Mínimo (meses)</Label>
              <Input
                type="number"
                value={config.plazoMinimo}
                onChange={(e) => updateConfig('plazoMinimo', parseInt(e.target.value))}
                className="border-[#e8eaed] focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b6a6e] uppercase tracking-wider font-semibold">Plazo Máximo (meses)</Label>
              <Input
                type="number"
                value={config.plazoMaximo}
                onChange={(e) => updateConfig('plazoMaximo', parseInt(e.target.value))}
                className="border-[#e8eaed] focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#6b6a6e] uppercase tracking-wider font-semibold">Días de Gracia</Label>
              <Input
                type="number"
                value={config.diasGracia}
                onChange={(e) => updateConfig('diasGracia', parseInt(e.target.value))}
                className="border-[#e8eaed] focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b6a6e] uppercase tracking-wider font-semibold">Capitalización</Label>
              <select
                value={config.periodoCapitalizacion}
                onChange={(e) => updateConfig('periodoCapitalizacion', e.target.value)}
                className="flex h-11 w-full rounded-xl border border-[#e8eaed] bg-white px-4 text-sm focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 focus:outline-none"
              >
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Montos */}
      <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
        <CardHeader className="border-b border-[#e8eaed] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Límites de Montos</CardTitle>
              <CardDescription className="text-[#6b6a6e] mt-1">Configuración de rangos de préstamo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#6b6a6e] uppercase tracking-wider font-semibold">Monto Mínimo</Label>
              <Input
                type="number"
                value={config.montoMinimo}
                onChange={(e) => updateConfig('montoMinimo', parseInt(e.target.value))}
                className="border-[#e8eaed] focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b6a6e] uppercase tracking-wider font-semibold">Monto Máximo</Label>
              <Input
                type="number"
                value={config.montoMaximo}
                onChange={(e) => updateConfig('montoMaximo', parseInt(e.target.value))}
                className="border-[#e8eaed] focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        className="w-full h-12 bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-xl shadow-lg shadow-[#55c3c5]/20 font-semibold"
      >
        <Save className="mr-2 h-5 w-5" />
        Guardar Configuración
      </Button>
    </div>
  );

  return (
    <div className="p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#3b3a3e] mb-2 tracking-tight font-semibold">Variables</h1>
          <p className="text-[#6b6a6e] text-base">
            Configuración de variables para el entorno de <strong className="text-[#55c3c5]">{environment === 'production' ? 'Producción' : 'Desarrollo'}</strong>
          </p>
        </div>
        <Badge
          className={`${
            environment === 'production'
              ? 'bg-[#55c3c5] text-white shadow-lg shadow-[#55c3c5]/20'
              : 'bg-[#4a494d] text-[#fefeff]'
          } border-0 font-semibold px-6 py-2 rounded-lg tracking-wide`}
        >
          {environment === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-[#e8eaed] hover:border-[#55c3c5]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#55c3c5]/5 group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 bg-gradient-to-br from-[#55c3c5] to-transparent"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-[#55c3c5]/10 group-hover:scale-110 transition-transform duration-300">
                <Percent className="h-6 w-6 text-[#55c3c5]" />
              </div>
            </div>
            <div className="text-4xl font-semibold text-[#3b3a3e] mb-2 tracking-tight">{currentConfig.tasaInteres}%</div>
            <p className="text-sm text-[#6b6a6e] font-medium">Tasa de Interés</p>
          </CardContent>
        </Card>

        <Card className="border border-[#e8eaed] hover:border-[#55c3c5]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#55c3c5]/5 group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 bg-gradient-to-br from-purple-500 to-transparent"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-4xl font-semibold text-[#3b3a3e] mb-2 tracking-tight">{currentConfig.plazoMaximo}</div>
            <p className="text-sm text-[#6b6a6e] font-medium">Plazo Máximo (meses)</p>
          </CardContent>
        </Card>

        <Card className="border border-[#e8eaed] hover:border-[#55c3c5]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#55c3c5]/5 group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 bg-gradient-to-br from-emerald-500 to-transparent"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-4xl font-semibold text-[#3b3a3e] mb-2 tracking-tight">${(currentConfig.montoMaximo / 1000).toFixed(0)}k</div>
            <p className="text-sm text-[#6b6a6e] font-medium">Monto Máximo</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration - Solo entorno actual */}
      <ConfigurationForm config={currentConfig} environment={environment === 'production' ? 'prod' : 'dev'} />

      {/* Preview Calculator */}
      <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
        <CardHeader className="border-b border-[#e8eaed] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#55c3c5]/10">
              <TrendingUp className="h-6 w-6 text-[#55c3c5]" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Simulador de Préstamo</CardTitle>
              <CardDescription className="text-[#6b6a6e] mt-1">Vista previa del comportamiento de la configuración</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-[#3b3a3e]">Monto del Préstamo</Label>
                <Input
                  type="number"
                  value={previewAmount}
                  onChange={(e) => setPreviewAmount(parseInt(e.target.value))}
                  className="text-2xl font-semibold h-14 border-[#e8eaed] focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-[#3b3a3e]">Plazo (meses): {previewTerm}</Label>
                <Slider
                  value={[previewTerm]}
                  onValueChange={([value]) => setPreviewTerm(value)}
                  min={3}
                  max={60}
                  step={1}
                  className="[&_[role=slider]]:bg-[#55c3c5] [&_[role=slider]]:border-[#55c3c5]"
                />
              </div>
              <div className="bg-gradient-to-br from-[#55c3c5]/10 to-[#55c3c5]/5 rounded-xl p-6 border border-[#55c3c5]/20">
                <p className="text-sm text-[#6b6a6e] mb-2">Cuota Mensual Estimada</p>
                <p className="text-4xl font-semibold text-[#55c3c5]">
                  ${calcularCuota(currentConfig, previewAmount, previewTerm).toFixed(2)}
                </p>
              </div>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generateAmortizationData(currentConfig)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="mes" stroke="#6b6a6e" fontSize={12} />
                  <YAxis stroke="#6b6a6e" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e8eaed',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Line type="monotone" dataKey="capital" stroke="#55c3c5" strokeWidth={2} name="Capital" />
                  <Line type="monotone" dataKey="interes" stroke="#ef4444" strokeWidth={2} name="Interés" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}