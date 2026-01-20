import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingUp, DollarSign, Users, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';

export function Ingresos() {
  const [activeTab, setActiveTab] = useState('prestamos');

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
      </Tabs>
    </div>
  );
}
