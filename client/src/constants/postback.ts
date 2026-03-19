/**
 * Constantes de Postback para o Cliente
 * Espelha as constantes do servidor
 */

export const POSTBACK_CONFIG = {
  // URL do Young Money (onde usuário completa tarefas)
  YOUNG_MONEY_URL: "https://youngmoney.com.br/",

  // Requisitos mínimos para liberar o bot
  MIN_IMPRESSIONS: 20,
  MIN_CLICKS: 2,

  // Intervalo de verificação inicial (em ms)
  // Verifica a cada 5 segundos se as tarefas foram completas
  CHECK_INTERVAL: 5000,

  // Intervalo de verificação de reset (em ms)
  // Verifica a cada 30 segundos se o postback foi resetado
  BOT_CHECK_INTERVAL: 30000,
} as const;
