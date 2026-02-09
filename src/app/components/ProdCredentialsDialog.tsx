import React, { useState } from 'react';
import { useProdPromotion } from '../contexts/ProdPromotionContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function ProdCredentialsDialog() {
  const {
    isCredentialsDialogOpen,
    submitProdCredentials,
    cancelPromotion,
  } = useProdPromotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      cancelPromotion();
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await submitProdCredentials(email.trim(), password);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isCredentialsDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Credenciales de producción</DialogTitle>
          <DialogDescription>
            Ingresá el usuario y contraseña del entorno de producción para poder subir los cambios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prod-email">Email</Label>
            <Input
              id="prod-email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-password">Contraseña</Label>
            <Input
              id="prod-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !email.trim() || !password}>
              {loading ? 'Verificando…' : 'Continuar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
