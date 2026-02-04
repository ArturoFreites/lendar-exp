import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ShieldAlert, LogOut } from 'lucide-react';
import logoImage from '../../assets/65d1f35782e19a4a8c4d56fc288c48d07bab3eaa.png';

/**
 * Pantalla mostrada cuando el usuario está logueado pero no tiene rol ADMIN.
 * Informa que solo administradores pueden acceder y permite cerrar sesión.
 */
export function SoloAdministradores() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fefeff] to-[#f8f9fa] p-4">
      <div className="w-full max-w-[440px]">
        <Card className="border-0 shadow-2xl shadow-black/5">
          <CardHeader className="space-y-4 text-center pb-4 pt-10">
            <div className="mx-auto w-20 mb-2">
              <img src={logoImage} alt="QR Logo" className="w-full h-auto" />
            </div>
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-amber-100 text-amber-600">
                <ShieldAlert className="h-10 w-10" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl text-[#3b3a3e] tracking-tight mb-2">
                Acceso restringido
              </CardTitle>
              <CardDescription className="text-[#6b6a6e] text-base">
                Solo administradores pueden acceder a esta aplicación. Si creés que deberías tener acceso, contactá al administrador del sistema.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-10 pb-6">
            <p className="text-sm text-center text-[#6b6a6e]">
              Podés cerrar sesión e iniciar con una cuenta de administrador.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-10">
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loggingOut}
              className="gap-2 border-[#55c3c5] text-[#55c3c5] hover:bg-[#55c3c5]/10"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
