import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, Edit3, ListTodo, Settings, Zap, Server, Activity, ArrowUpRight, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const areaData = [
  { name: 'Ene', solicitudes: 65, formularios: 28 },
  { name: 'Feb', solicitudes: 59, formularios: 32 },
  { name: 'Mar', solicitudes: 80, formularios: 41 },
  { name: 'Abr', solicitudes: 81, formularios: 45 },
  { name: 'May', solicitudes: 56, formularios: 38 },
  { name: 'Jun', solicitudes: 95, formularios: 52 },
];

const barData = [
  { name: 'Lun', tareas: 12 },
  { name: 'Mar', tareas: 19 },
  { name: 'Mié', tareas: 15 },
  { name: 'Jue', tareas: 25 },
  { name: 'Vie', tareas: 22 },
  { name: 'Sáb', tareas: 8 },
  { name: 'Dom', tareas: 5 },
];

const pieData = [
  { name: 'Aprobadas', value: 45, color: '#10b981' },
  { name: 'Pendientes', value: 30, color: '#f59e0b' },
  { name: 'En Revisión', value: 20, color: '#55c3c5' },
  { name: 'Rechazadas', value: 5, color: '#ef4444' },
];

export function Dashboard() {
  const { environment, apiUrl } = useAuth();

  const stats = [
    { label: 'Formularios Creados', value: '12', icon: Edit3, trend: '+12%', color: '#55c3c5', bgColor: 'bg-[#55c3c5]/10' },
    { label: 'Tipos de Tareas', value: '8', icon: ListTodo, trend: '+5%', color: '#a855f7', bgColor: 'bg-purple-500/10' },
    { label: 'Solicitudes Activas', value: '45', icon: FileText, trend: '+23%', color: '#3b82f6', bgColor: 'bg-blue-500/10' },
    { label: 'Acciones Configuradas', value: '16', icon: Zap, trend: '+8%', color: '#f59e0b', bgColor: 'bg-amber-500/10' },
  ];

  const recentActivity = [
    { 
      type: 'success',
      icon: CheckCircle2,
      text: 'Formulario "Solicitud Crédito" creado exitosamente', 
      time: 'Hace 2 horas',
      color: '#10b981'
    },
    { 
      type: 'info',
      icon: Activity,
      text: 'Tipo de tarea "Verificación KYC" actualizado', 
      time: 'Hace 5 horas',
      color: '#55c3c5'
    },
    { 
      type: 'warning',
      icon: Clock,
      text: 'Configuración de préstamo en revisión pendiente', 
      time: 'Ayer',
      color: '#f59e0b'
    },
    { 
      type: 'error',
      icon: AlertCircle,
      text: 'Acción "validar-documentos" requiere atención', 
      time: 'Hace 2 días',
      color: '#ef4444'
    },
  ];

  return (
    <div className="p-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-[#3b3a3e] mb-2 tracking-tight font-semibold">Panel de Control</h1>
        <p className="text-[#6b6a6e] text-base">
          Ambiente: <strong className="text-[#55c3c5] font-semibold">{environment === 'production' ? 'Producción' : 'Desarrollo'}</strong>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border border-[#e8eaed] hover:border-[#55c3c5]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#55c3c5]/5 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{ background: `radial-gradient(circle at top right, ${stat.color}, transparent)` }}></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.trend}
                  </div>
                </div>
                <div className="text-4xl font-semibold text-[#3b3a3e] mb-2 tracking-tight">{stat.value}</div>
                <p className="text-sm text-[#6b6a6e] font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <Card className="border border-[#e8eaed] shadow-lg shadow-black/5 lg:col-span-2">
          <CardHeader className="border-b border-[#e8eaed] pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Actividad Mensual</CardTitle>
                <CardDescription className="text-[#6b6a6e] mt-1">Solicitudes y formularios creados</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" />
                +18% vs mes anterior
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorSolicitudes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#55c3c5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#55c3c5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFormularios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                <XAxis dataKey="name" stroke="#6b6a6e" fontSize={12} />
                <YAxis stroke="#6b6a6e" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e8eaed',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                  }}
                />
                <Area type="monotone" dataKey="solicitudes" stroke="#55c3c5" strokeWidth={2} fillOpacity={1} fill="url(#colorSolicitudes)" />
                <Area type="monotone" dataKey="formularios" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorFormularios)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
          <CardHeader className="border-b border-[#e8eaed] pb-5">
            <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Estado de Solicitudes</CardTitle>
            <CardDescription className="text-[#6b6a6e] mt-1">Distribución actual</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e8eaed',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-[#6b6a6e]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-[#3b3a3e]">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
          <CardHeader className="border-b border-[#e8eaed] pb-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#55c3c5]/10">
                <ListTodo className="h-6 w-6 text-[#55c3c5]" />
              </div>
              <div>
                <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Tareas por Día</CardTitle>
                <CardDescription className="text-[#6b6a6e] mt-1">Actividad de la semana</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                <XAxis dataKey="name" stroke="#6b6a6e" fontSize={12} />
                <YAxis stroke="#6b6a6e" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e8eaed',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                  }}
                />
                <Bar dataKey="tareas" fill="#55c3c5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
          <CardHeader className="border-b border-[#e8eaed] pb-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#55c3c5]/10">
                <Activity className="h-6 w-6 text-[#55c3c5]" />
              </div>
              <div>
                <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Actividad Reciente</CardTitle>
                <CardDescription className="text-[#6b6a6e] mt-1">Últimos eventos del sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentActivity.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#f8f9fa] to-[#fefeff] rounded-xl border border-[#e8eaed] hover:border-[#55c3c5]/30 hover:shadow-md hover:shadow-[#55c3c5]/5 transition-all group">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                      <Icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#3b3a3e] leading-relaxed">{item.text}</p>
                      <p className="text-xs text-[#6b6a6e] mt-1.5">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Config */}
      <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
        <CardHeader className="border-b border-[#e8eaed] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#55c3c5]/10">
              <Server className="h-6 w-6 text-[#55c3c5]" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Configuración de Ambiente</CardTitle>
              <CardDescription className="text-[#6b6a6e] mt-1">Información del ambiente actual</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gradient-to-br from-[#f8f9fa] to-[#fefeff] rounded-xl p-6 border border-[#e8eaed]">
            <p className="text-xs text-[#6b6a6e] mb-3 uppercase tracking-wider font-semibold">URL de API</p>
            <p className="font-mono text-sm text-[#3b3a3e] font-medium break-all leading-relaxed bg-white px-4 py-3 rounded-lg border border-[#e8eaed]">{apiUrl}</p>
            <p className="text-sm text-[#6b6a6e] leading-relaxed mt-4">
              Todas las peticiones serán realizadas a este endpoint según el ambiente seleccionado. El sistema está configurado para trabajar con la API en modo <strong className="text-[#55c3c5]">{environment}</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
