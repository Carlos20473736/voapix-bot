/**
 * Hook para gerenciar lógica de postback Monetag
 * Coordena geração de YMID, verificação de stats e detecção de reset
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
   * Gera um novo YMID para o usuário
   */
  const generateYmid = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await api.postback.generateYmid.mutate();

      setState((prev) => ({
        ...prev,
        ymid: result.ymid,
        loading: false,
      }));

      return result;
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

    // Reiniciar verificação inicial
    if (state.ymid) {
      checkTimerRef.current = setInterval(async () => {
        const statsResult = await checkStatsOnce(state.ymid!);
        if (statsResult?.isReady && !state.botUnlocked) {
          unlockBot();
        }
      }, POSTBACK_CONFIG.CHECK_INTERVAL);
    }
  }, [state.ymid, state.botUnlocked, checkStatsOnce, unlockBot]);

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
