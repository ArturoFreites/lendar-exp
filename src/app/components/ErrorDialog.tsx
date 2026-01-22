import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorInfo {
  title?: string;
  message: string;
  details?: string;
  code?: number;
  errors?: string[];
}

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorInfo | null;
}

export function ErrorDialog({ isOpen, onClose, error }: ErrorDialogProps) {
  if (!error) return null;

  const title = error.title || 'Error en la petición';
  const message = error.message || 'Ha ocurrido un error';
  const hasDetails = error.details || error.errors?.length || error.code;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            <p className="text-base text-foreground">{message}</p>
          </DialogDescription>
        </DialogHeader>

        {hasDetails && (
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            {error.code && (
              <div className="text-sm">
                <span className="font-semibold">Código de error: </span>
                <span className="text-muted-foreground">{error.code}</span>
              </div>
            )}

            {error.errors && error.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">Errores adicionales:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {error.errors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {error.details && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">Detalles técnicos:</p>
                <pre className="max-h-40 overflow-auto rounded bg-background p-2 text-xs text-muted-foreground">
                  {error.details}
                </pre>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} variant="default">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
