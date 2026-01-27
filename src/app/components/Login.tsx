import React, { useState } from 'react';
import { useAuth, Environment } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Server, Zap, Lock, User, Home } from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '../../assets/65d1f35782e19a4a8c4d56fc288c48d07bab3eaa.png';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [environment, setEnvironment] = useState<Environment>('development');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password, environment);
    } catch (error) {
      // El error ya se maneja en AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fefeff] to-[#f8f9fa] p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-[440px] animate-in slide-in-from-bottom-4 duration-700">
        <Card className="border-0 shadow-2xl shadow-black/5 hover:shadow-3xl transition-shadow duration-300">
          <CardHeader className="space-y-4 text-center pb-8 pt-10">
            <div className="mx-auto w-20 mb-2">
              <img src={logoImage} alt="QR Logo" className="w-full h-auto" />
            </div>
            <div>
              <CardTitle className="text-3xl text-[#3b3a3e] tracking-tight mb-2">
                CRM Lendar
              </CardTitle>
              <CardDescription className="text-[#6b6a6e] text-base">
                Sistema de configuración empresarial
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 px-10">
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#6b6a6e]">Selecciona el Ambiente</Label>
                <RadioGroup
                  value={environment}
                  onValueChange={(value) => setEnvironment(value as Environment)}
                  className="grid grid-cols-3 gap-3"
                >
                  <div>
                    <RadioGroupItem
                      value="local"
                      id="local"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="local"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-[#e8eaed] bg-white p-5 hover:border-[#55c3c5] hover:bg-[#55c3c5]/[0.02] hover:scale-105 peer-data-[state=checked]:border-[#55c3c5] peer-data-[state=checked]:bg-[#55c3c5]/[0.04] peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-[#55c3c5]/10 cursor-pointer transition-all duration-300"
                    >
                      <div className="p-3 rounded-xl bg-[#55c3c5]/10 mb-3">
                        <Home className="h-5 w-5 text-[#55c3c5]" />
                      </div>
                      <span className="font-semibold text-[#3b3a3e] text-sm">Local</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="development"
                      id="development"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="development"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-[#e8eaed] bg-white p-5 hover:border-[#55c3c5] hover:bg-[#55c3c5]/[0.02] hover:scale-105 peer-data-[state=checked]:border-[#55c3c5] peer-data-[state=checked]:bg-[#55c3c5]/[0.04] peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-[#55c3c5]/10 cursor-pointer transition-all duration-300"
                    >
                      <div className="p-3 rounded-xl bg-[#55c3c5]/10 mb-3">
                        <Server className="h-5 w-5 text-[#55c3c5]" />
                      </div>
                      <span className="font-semibold text-[#3b3a3e] text-sm">Development</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="production"
                      id="production"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="production"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-[#e8eaed] bg-white p-5 hover:border-[#55c3c5] hover:bg-[#55c3c5]/[0.02] hover:scale-105 peer-data-[state=checked]:border-[#55c3c5] peer-data-[state=checked]:bg-[#55c3c5]/[0.04] peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-[#55c3c5]/10 cursor-pointer transition-all duration-300"
                    >
                      <div className="p-3 rounded-xl bg-[#55c3c5]/10 mb-3">
                        <Zap className="h-5 w-5 text-[#55c3c5]" />
                      </div>
                      <span className="font-semibold text-[#3b3a3e] text-sm">Production</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-[#6b6a6e]">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ingresa tu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12 border-[#e8eaed] bg-white focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6a6e]">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-[#6b6a6e]">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-11 h-12 border-[#e8eaed] bg-white focus:border-[#55c3c5] focus:ring-4 focus:ring-[#55c3c5]/10 rounded-xl transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6a6e]">
                    <Lock className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-10 px-10">
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#55c3c5] hover:bg-[#3db3b5] text-white rounded-xl shadow-lg shadow-[#55c3c5]/20 hover:shadow-xl hover:shadow-[#55c3c5]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-semibold" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
