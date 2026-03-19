/**
 * Constantes de Postback para o Cliente
 * Espelha as constantes do servidor
 */

export const POSTBACK_CONFIG = {
  // URL do Young Money (onde usuário completa tarefas)
  YOUNG_MONEY_URL: "https://youngmoney-bot-production-110d.up.railway.app/",

  // API Monetag para verificação de stats
  MONETAG_API: "https://monetag-postback-server-production.up.railway.app/api/stats/user/",

  // API Monetag para envio de postback
  MONETAG_POSTBACK_API: "https://monetag-postback-server-production.up.railway.app",

  // Zone ID do Monetag
  ZONE_ID: "10325249",

  // Requisitos mínimos para liberar o bot
  MIN_IMPRESSIONS: 20,
  MIN_CLICKS: 2,

  // Intervalo de verificação inicial (em ms)
  // Verifica a cada 5 segundos se as tarefas foram completas
  CHECK_INTERVAL: 5000,

  // Intervalo de verificação de reset (em ms)
  // Verifica a cada 10 segundos se o postback foi resetado
  BOT_CHECK_INTERVAL: 10000,

  // localStorage key para persistir o YMID
  STORAGE_KEY: "voapix_ymid_3d",
} as const;
