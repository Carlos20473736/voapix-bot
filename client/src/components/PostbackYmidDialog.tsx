/**
 * Componente: Diálogo de Geração e Verificação de YMID
 * Modal interativo que:
 * 1. Gera YMID único
 * 2. Mostra verificação em tempo real da API Monetag
 * 3. Exibe progresso com animações
 * 4. Libera bot quando requisitos são atingidos
 */

import React, { useEffect, useState } from "react";
import { usePostback } from "@/hooks/usePostback";
import { POSTBACK_CONFIG } from "@/constants/postback";

export interface PostbackYmidDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onBotUnlocked?: () => void;
  onError?: (error: string) => void;
}

interface VerificationStep {
  id: string;
  label: string;
  required: number;
  current: number;
  status: "pending" | "checking" | "success" | "failed";
}

export function PostbackYmidDialog({
  isOpen,
  onClose,
  onBotUnlocked,
  onError,
}: PostbackYmidDialogProps) {
  const postback = usePostback();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      id: "impressions",
      label: "Impressões",
      required: POSTBACK_CONFIG.MIN_IMPRESSIONS,
      current: 0,
      status: "pending",
    },
    {
      id: "clicks",
      label: "Cliques",
      required: POSTBACK_CONFIG.MIN_CLICKS,
      current: 0,
      status: "pending",
    },
  ]);

  /**
   * Gerar YMID ao abrir o diálogo
   */
  useEffect(() => {
    if (!isOpen) return;

    const generateNewYmid = async () => {
      try {
        setIsGenerating(true);
        await postback.generateYmid();
        setIsGenerating(false);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Erro ao gerar YMID";
        onError?.(errorMsg);
        setIsGenerating(false);
      }
    };

    generateNewYmid();
  }, [isOpen]);

  /**
   * Atualizar steps de verificação quando stats mudam
   */
  useEffect(() => {
    setVerificationSteps((prev) =>
      prev.map((step) => {
        const current =
          step.id === "impressions"
            ? postback.stats.impressions
            : postback.stats.clicks;
        const isSuccess = current >= step.required;

        return {
          ...step,
          current,
          status: isSuccess ? "success" : "checking",
        };
      })
    );
  }, [postback.stats]);

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
      // Fallback
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

  /**
   * Calcular progresso geral
   */
  const overallProgress = Math.round(
    (verificationSteps.filter((s) => s.status === "success").length /
      verificationSteps.length) *
      100
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Container */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">VoaPix Bot</h2>
            <p className="text-sm text-slate-400 mt-1">Verificação de Tarefas</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Generating State */}
          {isGenerating ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-4">
                <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-300 font-medium">Gerando seu YMID...</p>
            </div>
          ) : (
            <>
              {/* YMID Display */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 rounded-xl p-6">
                <div className="text-center mb-4">
                  <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                    ID Único
                  </span>
                </div>

                {/* YMID Value */}
                <div className="font-mono text-lg font-bold text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-center mb-4 break-all">
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
                  {copied ? "✓ Copiado!" : "📋 Copiar Código"}
                </button>
              </div>

              {/* Verification Steps */}
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300">Progresso</span>
                  <span className="text-sm font-bold text-indigo-400">
                    {overallProgress}%
                  </span>
                </div>

                {verificationSteps.map((step) => (
                  <div key={step.id} className="space-y-2">
                    {/* Step Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {step.status === "success" ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                            <span className="text-emerald-400 text-xs">✓</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></div>
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-300">
                          {step.label}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          step.status === "success"
                            ? "text-emerald-400"
                            : "text-slate-400"
                        }`}
                      >
                        {step.current}/{step.required}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          step.status === "success"
                            ? "w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                            : "bg-gradient-to-r from-indigo-500 to-cyan-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (step.current / step.required) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Message */}
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 text-center">
                {postback.botUnlocked ? (
                  <>
                    <p className="text-sm font-medium text-emerald-400 mb-2">
                      ✓ Verificação Completa!
                    </p>
                    <p className="text-xs text-slate-400">
                      Suas tarefas foram confirmadas. O bot está pronto para usar!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-300 mb-2">
                      Aguardando Verificação...
                    </p>
                    <p className="text-xs text-slate-500">
                      Complete as tarefas no Young Money para desbloquear o bot
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleOpenYoungMoney}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  <span>Acessar Young Money</span>
                </button>

                {postback.botUnlocked && (
                  <button
                    onClick={onClose}
                    className="w-full px-6 py-3 bg-emerald-500/20 text-emerald-400 font-semibold rounded-lg border border-emerald-500/50 hover:bg-emerald-500/30 transition-all duration-200"
                  >
                    ✓ Começar
                  </button>
                )}
              </div>

              {/* Footer Info */}
              <div className="text-center text-xs text-slate-500 space-y-1">
                <p>
                  Mínimo: {POSTBACK_CONFIG.MIN_IMPRESSIONS} impressões +{" "}
                  {POSTBACK_CONFIG.MIN_CLICKS} cliques
                </p>
                <p>Verificação automática a cada 5 segundos</p>
              </div>

              {/* Error Message */}
              {postback.error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                  <p className="text-sm text-red-400">{postback.error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

