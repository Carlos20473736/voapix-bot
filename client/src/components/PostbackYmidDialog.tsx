/**
 * Componente: Diálogo de Geração e Verificação de YMID
 * Design profissional e limpo, sem emojis
 */

import React, { useEffect, useState } from "react";
import { usePostback } from "@/hooks/usePostback";
import { POSTBACK_CONFIG } from "@/constants/postback";

export interface PostbackYmidDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onBotUnlocked?: () => void;
  onBotLocked?: () => void;
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
  onBotLocked,
  onError,
}: PostbackYmidDialogProps) {
  const postback = usePostback();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      id: "impressions",
      label: "Impressoes",
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

  useEffect(() => {
    if (postback.botUnlocked) {
      onBotUnlocked?.();
    }
  }, [postback.botUnlocked, onBotUnlocked]);

  // Detectar quando o postback resetou e o bot foi bloqueado
  useEffect(() => {
    if (!postback.botUnlocked && !postback.ymid && !postback.loading) {
      onBotLocked?.();
    }
  }, [postback.botUnlocked, postback.ymid, postback.loading, onBotLocked]);

  const handleCopyYmid = async () => {
    if (!postback.ymid) return;
    try {
      await navigator.clipboard.writeText(postback.ymid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
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

  const handleOpenYoungMoney = () => {
    window.open(POSTBACK_CONFIG.YOUNG_MONEY_URL, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(6,6,15,0.92)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-[400px] text-center"
        style={{ animation: "fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Title */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#f1f5f9",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            VoaPix Bot
          </h1>
        </div>

        {/* YMID Container */}
        <div
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20,
            padding: "32px 28px",
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), rgba(6,182,212,0.3), transparent)",
            }}
          />

          {isGenerating ? (
            <div style={{ padding: "16px 0" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "3px solid rgba(99,102,241,0.2)",
                  borderTopColor: "#6366f1",
                  borderRadius: "50%",
                  margin: "0 auto 14px",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                Gerando codigo...
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "inline-block",
                  padding: "5px 14px",
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#818cf8",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 18,
                }}
              >
                Seu YMID
              </div>

              {/* YMID Number */}
              <div
                style={{
                  fontFamily: "'Space Grotesk', 'Inter', monospace",
                  fontSize: 36,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  background: "linear-gradient(135deg, #c7d2fe 0%, #818cf8 30%, #06b6d4 70%, #67e8f9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1,
                  marginBottom: 16,
                }}
              >
                {postback.ymid || "---"}
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyYmid}
                disabled={!postback.ymid}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 16px",
                  background: copied ? "rgba(0,220,170,0.08)" : "rgba(99,102,241,0.08)",
                  border: `1px solid ${copied ? "rgba(0,220,170,0.3)" : "rgba(99,102,241,0.15)"}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  color: copied ? "#00DCAA" : "#818cf8",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "Copiado" : "Copiar codigo"}
              </button>
            </>
          )}
        </div>

        {/* Verification Progress */}
        {!isGenerating && postback.ymid && (
          <div
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 16,
              padding: "22px 24px",
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            {verificationSteps.map((step, index) => (
              <div key={step.id} style={{ marginBottom: index < verificationSteps.length - 1 ? 16 : 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>
                    {step.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: step.status === "success" ? "#00DCAA" : "#64748b",
                    }}
                  >
                    {step.current}/{step.required}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 2,
                      transition: "width 0.4s ease",
                      background:
                        step.status === "success"
                          ? "linear-gradient(90deg, #00DCAA, #06b6d4)"
                          : "linear-gradient(90deg, #6366f1, #06b6d4)",
                      width: `${Math.min((step.current / step.required) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        {!isGenerating && postback.ymid && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 0",
            }}
          >
            {postback.botUnlocked ? (
              <p style={{ fontSize: 13, fontWeight: 600, color: "#00DCAA", margin: 0 }}>
                Verificacao completa
              </p>
            ) : (
              <p style={{ fontSize: 12, color: "#3f4a5c", margin: 0 }}>
                Apos completar as missoes, o bot sera liberado automaticamente.
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        {!isGenerating && (
          <>
            {postback.botUnlocked ? (
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  border: "none",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #00DCAA 0%, #06b6d4 100%)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 24px rgba(0,220,170,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={handleOpenYoungMoney}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  border: "none",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #6366f1 100%)",
                  backgroundSize: "200% 200%",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 24px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                Acessar Young Money
              </button>
            )}
          </>
        )}



        {/* Error */}
        {postback.error && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
            }}
          >
            <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{postback.error}</p>
          </div>
        )}

        {/* Keyframes */}
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
