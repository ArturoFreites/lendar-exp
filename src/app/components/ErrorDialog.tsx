import React, { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertCircle, Copy, Check } from 'lucide-react';

const MAX_MESSAGE_DISPLAY = 800;

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

function safeString(value: unknown): string {
  if (value == null) return '';
  return typeof value === 'string' ? value : String(value);
}

export function ErrorDialog({ isOpen, onClose, error }: ErrorDialogProps) {
  const [copied, setCopied] = useState(false);

  const buildFullErrorText = useCallback(() => {
    if (!error) return '';
    const parts: string[] = [];
    parts.push(safeString(error.title || 'Error en la petición'));
    parts.push('');
    parts.push(safeString(error.message || 'Ha ocurrido un error'));
    if (error.code != null) {
      parts.push('');
      parts.push(`Código: ${error.code}`);
    }
    if (Array.isArray(error.errors) && error.errors.length > 0) {
      parts.push('');
      parts.push('Errores adicionales:');
      error.errors.forEach((e) => parts.push(`  - ${safeString(e)}`));
    }
    if (error.details) {
      parts.push('');
      parts.push('Detalles técnicos:');
      parts.push(safeString(error.details));
    }
    return parts.join('\n');
  }, [error]);

  const handleCopy = useCallback(async () => {
    const text = buildFullErrorText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [buildFullErrorText]);

  if (!error) return null;

  const title = safeString(error.title || 'Error en la petición').slice(0, 120);
  const message = safeString(error.message || 'Ha ocurrido un error');
  const messagePreview = message.length > MAX_MESSAGE_DISPLAY ? message.slice(0, MAX_MESSAGE_DISPLAY) + '…' : message;
  const hasExtra = error.details || (Array.isArray(error.errors) && error.errors.length > 0);

  const extraSummary =
    error.details && (error.errors?.length ?? 0) > 0
      ? `Detalles técnicos (${error.details.split('\n').length} líneas) · ${error.errors?.length ?? 0} errores`
      : error.details
        ? `Detalles técnicos (${error.details.split('\n').length} líneas)`
        : Array.isArray(error.errors) && error.errors.length > 0
          ? `${error.errors.length} error(es) adicional(es)`
          : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl break-words pr-8">{title}</DialogTitle>
              <DialogDescription asChild>
                <p className="text-base text-foreground mt-2 break-words overflow-wrap-anywhere">
                  {messagePreview}
                </p>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-shrink-0 px-6 py-3 space-y-2">
          {error.code != null && (
            <div className="text-sm">
              <span className="font-semibold">Código: </span>
              <span className="text-muted-foreground">{error.code}</span>
            </div>
          )}

          {hasExtra && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-sm text-muted-foreground truncate flex-1 min-w-0" title={extraSummary}>
                {extraSummary}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar error
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-border/50 gap-2">
          {!hasExtra && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar error'}
            </Button>
          )}
          <Button onClick={onClose} variant="default">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
