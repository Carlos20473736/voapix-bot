/**
 * Componente: Painel de Verificação em Tempo Real
 * Mostra:
 * 1. Status da API Monetag
 * 2. Logs de verificação
 * 3. Histórico de requisições
 * 4. Indicadores de conexão
 */

import React, { useEffect, useState } from "react";
import { usePostback } from "@/hooks/usePostback";
import { POSTBACK_CONFIG } from "@/constants/postback";

export interface PostbackVerificationPanelProps {
  ymid?: string;
  showLogs?: boolean;
}

interface VerificationLog {
  timestamp: Date;
  type: "check" | "reset" | "success" | "error" | "info";
  message: string;
  impressions?: number;
  clicks?: number;
}

export function PostbackVerificationPanel({
  ymid,
  showLogs = true,
}: PostbackVerificationPanelProps) {
  const postback = usePostback();
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [apiStatus, setApiStatus] = useState<
    "idle" | "checking" | "success" | "error"
  >("idle");
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [checkCount, setCheckCount] = useState(0);

  /**
   * Adicionar log
   */
  const addLog = (
    type: VerificationLog["type"],
    message: string,
    impressions?: number,
    clicks?: number
  ) => {
    setLogs((prev) => [
      {
        timestamp: new Date(),
        type,
        message,
        impressions,
        clicks,
      },
      ...prev,
    ]);
  };

  /**
   * Monitorar mudanças de stats
   */
  useEffect(() => {
    if (!postback.ymid) return;

    setApiStatus("checking");
    setLastCheckTime(new Date());
    setCheckCount((prev) => prev + 1);

    // Simular verificação
    const timer = setTimeout(() => {
      if (postback.stats.impressions > 0 || postback.stats.clicks > 0) {
        setApiStatus("success");
        addLog(
          "check",
          `Verificação #${checkCount + 1}: API respondeu com sucesso`,
          postback.stats.impressions,
          postback.stats.clicks
        );
      } else {
        setApiStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [postback.stats, postback.ymid]);

  /**
   * Monitorar desbloqueio do bot
   */
  useEffect(() => {
    if (postback.botUnlocked) {
      addLog(
        "success",
        "✓ Bot desbloqueado! Requisitos atingidos.",
        postback.stats.impressions,
        postback.stats.clicks
      );
    }
  }, [postback.botUnlocked]);

  /**
   * Monitorar erros
   */
  useEffect(() => {
    if (postback.error) {
      setApiStatus("error");
      addLog("error", `Erro: ${postback.error}`);
    }
  }, [postback.error]);

  /**
   * Formatar hora
   */
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /**
   * Obter cor do status
   */
  const getStatusColor = (type: VerificationLog["type"]) => {
    switch (type) {
      case "success":
        return "text-emerald-400";
      case "error":
        return "text-red-400";
      case "check":
        return "text-cyan-400";
      case "reset":
        return "text-orange-400";
      default:
        return "text-slate-400";
    }
  };

  /**
   * Obter ícone do tipo
   */
  const getTypeIcon = (type: VerificationLog["type"]) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "check":
        return "→";
      case "reset":
        return "⟳";
      default:
        return "•";
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* API Status */}
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  apiStatus === "success"
                    ? "bg-emerald-500"
                    : apiStatus === "error"
                      ? "bg-red-500"
                      : apiStatus === "checking"
                        ? "bg-cyan-500 animate-pulse"
                        : "bg-slate-500"
                }`}
              ></div>
              <span className="text-xs font-medium text-slate-400">API Status</span>
            </div>
            <p className="text-sm font-bold text-slate-200">
              {apiStatus === "success"
                ? "Conectado"
                : apiStatus === "error"
                  ? "Erro"
                  : apiStatus === "checking"
                    ? "Verificando..."
                    : "Aguardando"}
            </p>
          </div>

          {/* Last Check */}
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-400 mb-1">
              Última Verificação
            </div>
            <p className="text-sm font-bold text-slate-200">
              {lastCheckTime ? formatTime(lastCheckTime) : "---"}
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <div className="text-xs text-slate-400">Impressões</div>
            <div className="text-lg font-bold text-cyan-400">
              {postback.stats.impressions}
            </div>
            <div className="text-xs text-slate-500">mín: {POSTBACK_CONFIG.MIN_IMPRESSIONS}</div>
          </div>
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <div className="text-xs text-slate-400">Cliques</div>
            <div className="text-lg font-bold text-purple-400">
              {postback.stats.clicks}
            </div>
            <div className="text-xs text-slate-500">mín: {POSTBACK_CONFIG.MIN_CLICKS}</div>
          </div>
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <div className="text-xs text-slate-400">Verificações</div>
            <div className="text-lg font-bold text-indigo-400">{checkCount}</div>
            <div className="text-xs text-slate-500">a cada 5s</div>
          </div>
        </div>
      </div>

      {/* Logs */}
      {showLogs && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="bg-slate-700/50 px-4 py-2 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300">📋 Histórico de Verificações</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                Nenhuma verificação realizada ainda
              </div>
            ) : (
              <div className="divide-y divide-slate-700/30">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-xs font-bold mt-0.5 ${getStatusColor(
                          log.type
                        )}`}
                      >
                        {getTypeIcon(log.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs text-slate-300 break-words">
                            {log.message}
                          </p>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        {(log.impressions !== undefined ||
                          log.clicks !== undefined) && (
                          <div className="text-xs text-slate-500 mt-1">
                            {log.impressions !== undefined && (
                              <span>Imp: {log.impressions} </span>
                            )}
                            {log.clicks !== undefined && (
                              <span>Clk: {log.clicks}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

