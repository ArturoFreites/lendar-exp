import React from 'react';
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

export function PromoteConfirmDialog() {
  const {
    isConfirmDialogOpen,
    summary,
    promoting,
    confirmPromotion,
    cancelPromotion,
  } = useProdPromotion();

  const handleOpenChange = (open: boolean) => {
    if (!open) cancelPromotion();
  };

  const handleConfirm = async () => {
    try {
      await confirmPromotion();
    } catch {
      // toast already shown in context
    }
  };

  return (
    <Dialog open={isConfirmDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir a producción</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés subir esto a producción?
          </DialogDescription>
        </DialogHeader>
        {summary && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <p className="font-medium text-sm">{summary.label}</p>
            <p className="text-sm text-muted-foreground break-words">{summary.detail}</p>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={promoting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={promoting}>
            {promoting ? 'Subiendo…' : 'Sí, subir a producción'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
