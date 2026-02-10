import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useUtilities } from '../../hooks/use-utilities';
import { Wrench, MapPin, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { NormalizeAddressesJobStatusResponse } from '../../types/dto';

const POLL_INTERVAL_MS = 1500;
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED'];

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    RUNNING: 'En curso',
    COMPLETED: 'Completado',
    FAILED: 'Error',
  };
  return labels[status] ?? status;
}

export function Utilidades() {
  const { startNormalizeAddresses, getNormalizeAddressesJobStatus, hasApi } = useUtilities();
  const [modalOpen, setModalOpen] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'starting' | 'polling' | 'done' | 'error'>('idle');
  const [status, setStatus] = useState<NormalizeAddressesJobStatusResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleCloseModal = useCallback(() => {
    stopPolling();
    setModalOpen(false);
    setPhase('idle');
    setStatus(null);
    setErrorMessage(null);
  }, [stopPolling]);

  const handleStartNormalize = useCallback(async () => {
    if (!hasApi) return;
    setModalOpen(true);
    setPhase('starting');
    setStatus(null);
    setErrorMessage(null);

    try {
      const response = await startNormalizeAddresses();
      if (!response?.data?.jobId) {
        const msg = response?.message ?? 'No se pudo iniciar el proceso. Verifique que el backend esté disponible.';
        setErrorMessage(msg);
        setPhase('error');
        return;
      }
      const jobId = response.data.jobId;
      setPhase('polling');

      const poll = async () => {
        const result = await getNormalizeAddressesJobStatus(jobId);
        if (!result?.data) {
          if (result?.message) setErrorMessage(result.message);
          else setErrorMessage('No se pudo obtener el estado del proceso.');
          setPhase('error');
          stopPolling();
          return;
        }
        setStatus(result.data);
        if (TERMINAL_STATUSES.includes(result.data.status)) {
          stopPolling();
          setPhase('done');
        }
      };

      await poll();
      pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Ocurrió un error';
      setErrorMessage(msg);
      setPhase('error');
    }
  }, [hasApi, startNormalizeAddresses, getNormalizeAddressesJobStatus, stopPolling]);

  return (
    <div className="p-10 space-y-8">
      <div>
        <h1 className="text-3xl text-[#3b3a3e] mb-2 tracking-tight font-semibold">Utilidades</h1>
        <p className="text-[#6b6a6e] text-base">Acciones de mantenimiento y procesos por lotes.</p>
      </div>

      <Card className="border border-[#e8eaed] shadow-lg shadow-black/5">
        <CardHeader className="border-b border-[#e8eaed] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#55c3c5]/10">
              <MapPin className="h-6 w-6 text-[#55c3c5]" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#3b3a3e] tracking-tight">Normalizar direcciones de solicitudes</CardTitle>
              <CardDescription className="text-[#6b6a6e] mt-1">
                Ejecuta el proceso que normaliza las direcciones de las aplicaciones (solicitudes).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Button
            onClick={handleStartNormalize}
            disabled={!hasApi}
            className="bg-[#55c3c5] hover:bg-[#4ab3b5] text-white"
          >
            <Wrench className="mr-2 h-4 w-4" />
            Ejecutar normalización
          </Button>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Normalizar direcciones de solicitudes</DialogTitle>
            <DialogDescription>
              {phase === 'starting' && 'Iniciando proceso…'}
              {phase === 'polling' && 'Proceso en curso. No cierre esta ventana.'}
              {phase === 'done' && (status?.status === 'COMPLETED' ? 'Proceso finalizado correctamente.' : 'Proceso finalizado.')}
              {phase === 'error' && 'Se produjo un error.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(phase === 'starting' || (phase === 'polling' && !status)) && (
              <div className="flex items-center gap-3 text-[#6b6a6e]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Cargando…</span>
              </div>
            )}
            {phase === 'polling' && status && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6b6a6e]">Estado</span>
                  <span className="font-medium text-[#3b3a3e]">{statusLabel(status.status)}</span>
                </div>
                <Progress value={status.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-[#6b6a6e]">
                  <span>{status.processed} de {status.total} procesados</span>
                  <span>{status.percentage}%</span>
                </div>
              </div>
            )}
            {phase === 'done' && status && (
              <div className="space-y-3">
                {status.status === 'COMPLETED' ? (
                  <div className="flex items-center gap-3 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Completado: {status.processed} de {status.total} procesados.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-amber-600">
                    <XCircle className="h-5 w-5" />
                    <span>{status.errorMessage ?? 'El proceso finalizó con errores.'}</span>
                  </div>
                )}
              </div>
            )}
            {phase === 'error' && errorMessage && (
              <div className="flex items-start gap-3 text-red-600">
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
