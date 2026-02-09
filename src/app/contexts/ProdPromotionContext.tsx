import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import type { ProdPromotionRepository } from '../repositories/prod-promotion.repository';
import { buildPromotionSummary, createPromoteToProdUseCase } from '../usecases/promote-to-prod.usecase';
import type {
  ProdSession,
  PromoteableType,
  PromotionSummaryItem,
  PendingPromotion,
} from '../types/promotion';
import { toast } from 'sonner';

const STORAGE_KEY = 'lendar_prod_promotion';

function loadSession(): ProdSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProdSession;
    if (parsed?.accessToken && parsed?.email && parsed?.baseUrl) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function saveSession(session: ProdSession | null): void {
  if (session) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

interface ProdPromotionContextType {
  prodSession: ProdSession | null;
  isCredentialsDialogOpen: boolean;
  isConfirmDialogOpen: boolean;
  pendingPromotion: PendingPromotion | null;
  summary: PromotionSummaryItem | null;
  promoting: boolean;
  openPromoteFlow: (type: PromoteableType, payload: unknown) => void;
  submitProdCredentials: (email: string, password: string) => Promise<void>;
  confirmPromotion: () => Promise<void>;
  cancelPromotion: () => void;
  clearProdSession: () => void;
}

const ProdPromotionContext = createContext<ProdPromotionContextType | undefined>(undefined);

interface ProdPromotionProviderProps {
  children: ReactNode;
  repo: ProdPromotionRepository;
  prodBaseUrl: string;
}

export function ProdPromotionProvider({ children, repo, prodBaseUrl }: ProdPromotionProviderProps) {
  const [prodSession, setProdSession] = useState<ProdSession | null>(loadSession);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [summary, setSummary] = useState<PromotionSummaryItem | null>(null);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    saveSession(prodSession);
  }, [prodSession]);

  const openPromoteFlow = useCallback(
    (type: PromoteableType, payload: unknown) => {
      setPendingPromotion({ type, payload });
      const nextSummary = buildPromotionSummary(type, payload);
      setSummary(nextSummary);
      if (prodSession) {
        setIsConfirmDialogOpen(true);
      } else {
        setIsCredentialsDialogOpen(true);
      }
    },
    [prodSession]
  );

  const submitProdCredentials = useCallback(
    async (email: string, password: string) => {
      try {
        const session = await repo.loginToProd(prodBaseUrl, email, password);
        setProdSession(session);
        setIsCredentialsDialogOpen(false);
        if (pendingPromotion) {
          const nextSummary = buildPromotionSummary(pendingPromotion.type, pendingPromotion.payload);
          setSummary(nextSummary);
          setIsConfirmDialogOpen(true);
        }
        toast.success('Sesión de producción iniciada');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al iniciar sesión en producción';
        toast.error(message);
        throw err;
      }
    },
    [repo, prodBaseUrl, pendingPromotion]
  );

  const confirmPromotion = useCallback(async () => {
    if (!pendingPromotion || !prodSession) return;
    setPromoting(true);
    try {
      const useCase = createPromoteToProdUseCase(repo);
      await useCase.execute(pendingPromotion.type, pendingPromotion.payload, prodSession);
      toast.success('Subido a producción correctamente');
      setPendingPromotion(null);
      setSummary(null);
      setIsConfirmDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir a producción';
      toast.error(message);
      throw err;
    } finally {
      setPromoting(false);
    }
  }, [repo, pendingPromotion, prodSession]);

  const cancelPromotion = useCallback(() => {
    setIsCredentialsDialogOpen(false);
    setIsConfirmDialogOpen(false);
    setPendingPromotion(null);
    setSummary(null);
  }, []);

  const clearProdSession = useCallback(() => {
    setProdSession(null);
    saveSession(null);
    toast.success('Sesión de producción cerrada');
  }, []);

  return (
    <ProdPromotionContext.Provider
      value={{
        prodSession,
        isCredentialsDialogOpen,
        isConfirmDialogOpen,
        pendingPromotion,
        summary,
        promoting,
        openPromoteFlow,
        submitProdCredentials,
        confirmPromotion,
        cancelPromotion,
        clearProdSession,
      }}
    >
      {children}
    </ProdPromotionContext.Provider>
  );
}

export function useProdPromotion() {
  const ctx = useContext(ProdPromotionContext);
  if (ctx === undefined) {
    throw new Error('useProdPromotion must be used within ProdPromotionProvider');
  }
  return ctx;
}
