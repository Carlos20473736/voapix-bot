/**
 * Constantes de Configuração para Postback Monetag
 * Integração com Young Money para verificação de tarefas completas
 */

export const POSTBACK_CONFIG = {
  // API Monetag para verificação de stats
  MONETAG_API: "https://monetag-postback-server-production.up.railway.app/api/stats/user/",

  // API Monetag para envio de postback
  MONETAG_POSTBACK_API: "https://monetag-postback-server-production.up.railway.app",

  // URL do Young Money (onde usuário completa tarefas)
  YOUNG_MONEY_URL: "https://youngmoney-bot-production-110d.up.railway.app/",

  // Zone ID do Monetag
  ZONE_ID: "10325249",

  // Requisitos mínimos para liberar o bot
  MIN_IMPRESSIONS: 20,
  MIN_CLICKS: 2,

  // Intervalo de verificação inicial (em ms)
  CHECK_INTERVAL: 5000,

  // Intervalo de verificação de reset (em ms)
  BOT_CHECK_INTERVAL: 10000,
} as const;

/**
 * Tipos de resposta da API Monetag
 */
export interface MonetagStatsResponse {
  success: boolean;
  total_impressions?: number;
  total_clicks?: number;
  user_id?: string;
  message?: string;
}

/**
 * Resposta normalizada do endpoint checkStats
 */
export interface CheckStatsResponse {
  success: boolean;
  impressions: number;
  clicks: number;
  isReady: boolean;
  message?: string;
}

/**
 * Resposta do endpoint checkReset
 */
export interface CheckResetResponse {
  wasReset: boolean;
  reason?: "api_error" | "stats_below_threshold" | "unknown";
  message?: string;
}

/**
 * Resposta do endpoint generateYmid
 */
export interface GenerateYmidResponse {
  ymid: string;
  youngMoneyUrl: string;
  expiresAt?: number;
}
