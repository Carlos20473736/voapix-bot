/**
 * Hook para gerenciar lógica de postback Monetag
 * Coordena geração de YMID numérico (3 dígitos), verificação de stats e detecção de reset
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { POSTBACK_CONFIG } from "@/constants/postback";

export interface PostbackState {
  ymid: string | null;
  botUnlocked: boolean;
  stats: {
    impressions: number;
    clicks: number;
  };
  loading: boolean;
  error: string | null;
}

/**
 * Gera ou recupera um YMID numérico de 3 dígitos (100-999)
 * Persiste no localStorage para manter entre sessões
 */
function getOrCreateYmid(): string {
  const saved = localStorage.getItem(POSTBACK_CONFIG.STORAGE_KEY);
  if (saved && saved.length === 3 && /^\d{3}$/.test(saved)) {
    return saved;
  }
  const newId = (100 + Math.floor(Math.random() * 900)).toString();
  localStorage.setItem(POSTBACK_CONFIG.STORAGE_KEY, newId);
  return newId;
}

export function usePostback() {
  const [state, setState] = useState<PostbackState>({
    ymid: null,
    botUnlocked: false,
    stats: { impressions: 0, clicks: 0 },
    loading: false,
    error: null,
  });

  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Gera ou recupera o YMID numérico de 3 dígitos
   * Usa localStorage para persistir entre sessões (mesma lógica do script original)
   */
  const generateYmid = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const ymid = getOrCreateYmid();

      setState((prev) => ({
        ...prev,
        ymid,
        loading: false,
      }));

      return { ymid, youngMoneyUrl: POSTBACK_CONFIG.YOUNG_MONEY_URL };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro ao gerar YMID";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
      throw error;
    }
  }, []);

  /**
   * Verifica stats do YMID na API Monetag
   */
  const checkStatsOnce = useCallback(async (ymid: string) => {
    try {
      const result = await api.postback.checkStats.query({ ymid });

      setState((prev) => ({
        ...prev,
        stats: {
          impressions: result.impressions,
          clicks: result.clicks,
        },
      }));

      return result;
    } catch (error) {
      console.error("[usePostback] Erro ao verificar stats:", error);
      return null;
    }
  }, []);

  /**
   * Verifica se o postback foi resetado
   */
  const checkResetOnce = useCallback(async (ymid: string) => {
    try {
      const result = await api.postback.checkReset.query({ ymid });
      return result;
    } catch (error) {
      console.error("[usePostback] Erro ao verificar reset:", error);
      return null;
    }
  }, []);

  /**
   * Libera o bot quando stats atingem o mínimo
   */
  const unlockBot = useCallback(() => {
    setState((prev) => ({ ...prev, botUnlocked: true }));

    // Parar verificação inicial
    if (checkTimerRef.current) {
      clearInterval(checkTimerRef.current);
      checkTimerRef.current = null;
    }

    // Iniciar verificação de reset
    if (state.ymid) {
      resetCheckTimerRef.current = setInterval(async () => {
        const resetResult = await checkResetOnce(state.ymid!);
        if (resetResult?.wasReset) {
          lockBot();
        }
      }, POSTBACK_CONFIG.BOT_CHECK_INTERVAL);
    }
  }, [state.ymid, checkResetOnce]);

  /**
   * Bloqueia o bot e volta para tela YMID
   */
  const lockBot = useCallback(() => {
    // Limpar YMID do localStorage para gerar um novo
    localStorage.removeItem(POSTBACK_CONFIG.STORAGE_KEY);

    setState((prev) => ({
      ...prev,
      botUnlocked: false,
      ymid: null,
      stats: { impressions: 0, clicks: 0 },
    }));

    // Parar verificação de reset
    if (resetCheckTimerRef.current) {
      clearInterval(resetCheckTimerRef.current);
      resetCheckTimerRef.current = null;
    }
  }, []);

  /**
   * Efeito: Verificar stats periodicamente enquanto YMID existe e bot não está desbloqueado
   */
  useEffect(() => {
    if (!state.ymid || state.botUnlocked) return;

    // Verificar imediatamente
    checkStatsOnce(state.ymid).then((result) => {
      if (result?.isReady) {
        unlockBot();
      }
    });

    // Depois verificar periodicamente
    checkTimerRef.current = setInterval(async () => {
      const result = await checkStatsOnce(state.ymid!);
      if (result?.isReady) {
        unlockBot();
      }
    }, POSTBACK_CONFIG.CHECK_INTERVAL);

    return () => {
      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current);
      }
    };
  }, [state.ymid, state.botUnlocked, checkStatsOnce, unlockBot]);

  /**
   * Efeito: Verificar reset periodicamente enquanto bot está desbloqueado
   */
  useEffect(() => {
    if (!state.ymid || !state.botUnlocked) return;

    resetCheckTimerRef.current = setInterval(async () => {
      const result = await checkResetOnce(state.ymid!);
      if (result?.wasReset) {
        lockBot();
      }
    }, POSTBACK_CONFIG.BOT_CHECK_INTERVAL);

    return () => {
      if (resetCheckTimerRef.current) {
        clearInterval(resetCheckTimerRef.current);
      }
    };
  }, [state.ymid, state.botUnlocked, checkResetOnce, lockBot]);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
      if (resetCheckTimerRef.current) clearInterval(resetCheckTimerRef.current);
    };
  }, []);

  return {
    ...state,
    generateYmid,
    checkStatsOnce,
    checkResetOnce,
    unlockBot,
    lockBot,
  };
}
