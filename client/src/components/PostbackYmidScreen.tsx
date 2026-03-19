/**
 * Componente: Tela de Verificação YMID
 * Mostra o ID único para o usuário e botão para acessar Young Money
 * Verifica automaticamente quando as tarefas são completas
 */

import React, { useEffect, useState } from "react";
import { usePostback } from "@/hooks/usePostback";
import { POSTBACK_CONFIG } from "@/constants/postback";

export interface PostbackYmidScreenProps {
  onBotUnlocked?: () => void;
  onError?: (error: string) => void;
}

export function PostbackYmidScreen({
  onBotUnlocked,
  onError,
}: PostbackYmidScreenProps) {
  const postback = usePostback();
  const [copied, setCopied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Gerar YMID ao montar o componente
   */
  useEffect(() => {
    const init = async () => {
      try {
        await postback.generateYmid();
        setIsInitializing(false);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Erro ao gerar YMID";
        onError?.(errorMsg);
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  /**
   * Notificar quando bot for desbloqueado
   */
  useEffect(() => {
    if (postback.botUnlocked) {
      onBotUnlocked?.();
    }
  }, [postback.botUnlocked, onBotUnlocked]);

  /**
   * Copiar YMID para clipboard
   */
  const handleCopyYmid = async () => {
    if (!postback.ymid) return;

    try {
      await navigator.clipboard.writeText(postback.ymid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback para navegadores antigos
      const textarea = document.createElement("textarea");
      textarea.value = postback.ymid;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * Abrir Young Money em nova aba
   */
  const handleOpenYoungMoney = () => {
    window.open(POSTBACK_CONFIG.YOUNG_MONEY_URL, "_blank");
  };

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-4">
            <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-300 font-medium">Gerando seu YMID...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-md px-4">
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">VoaPix Bot</h1>
            <p className="text-sm text-slate-400">Verificação de Tarefas</p>
          </div>

          {/* YMID Container */}
          <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 rounded-xl p-6 mb-6">
            <div className="text-center mb-4">
              <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 rounded-full mb-4">
                Seu YMID
              </span>
            </div>

            {/* YMID Value */}
            <div className="font-mono text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-center mb-4 break-all">
              {postback.ymid || "---"}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyYmid}
              disabled={!postback.ymid}
              className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                copied
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-500/30"
              }`}
            >
              {copied ? "✓ Copiado!" : "Copiar Código"}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-700/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-cyan-400">
                {postback.stats.impressions}
              </div>
              <div className="text-xs text-slate-400 mt-1">Impressões</div>
              <div className="text-xs text-slate-500 mt-1">
                (mín: {POSTBACK_CONFIG.MIN_IMPRESSIONS})
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-400">
                {postback.stats.clicks}
              </div>
              <div className="text-xs text-slate-400 mt-1">Cliques</div>
              <div className="text-xs text-slate-500 mt-1">
                (mín: {POSTBACK_CONFIG.MIN_CLICKS})
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-400">Progresso</span>
              <span className="text-xs font-medium text-slate-400">
                {postback.botUnlocked ? "✓ Completo" : "Aguardando..."}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  postback.botUnlocked
                    ? "w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                    : "w-1/3 bg-gradient-to-r from-indigo-500 to-cyan-500"
                }`}
              ></div>
            </div>
          </div>

          {/* Main Button */}
          <button
            onClick={handleOpenYoungMoney}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Acessar Young Money
          </button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete as tarefas no Young Money. O bot será liberado automaticamente
              quando você atingir {POSTBACK_CONFIG.MIN_IMPRESSIONS} impressões e{" "}
              {POSTBACK_CONFIG.MIN_CLICKS} cliques.
            </p>
          </div>

          {/* Error Message */}
          {postback.error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{postback.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

