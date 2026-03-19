/**
 * Lógica de Postback - Monetag Integration
 * Gerencia verificação de tarefas completas no Young Money
 */

import { POSTBACK_CONFIG, MonetagStatsResponse, CheckStatsResponse, CheckResetResponse } from "./postback.constants";

/**
 * Gera um YMID único para o usuário
 * Formato: YMID_[timestamp]_[random]
 */
export function generateYmid(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `YMID_${timestamp}_${random}`;
}

/**
 * Busca stats do YMID na API Monetag
 * @param ymid - ID único do usuário
 * @returns Dados brutos da API Monetag
 */
export async function fetchMonetagStats(ymid: string): Promise<MonetagStatsResponse> {
  try {
    const url = `${POSTBACK_CONFIG.MONETAG_API}?ymid=${encodeURIComponent(ymid)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "VoaPix-Bot/1.0",
      },
      timeout: 10000,
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data as MonetagStatsResponse;
  } catch (error) {
    console.error("[Postback] Erro ao buscar stats Monetag:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Verifica se o YMID atingiu os requisitos mínimos
 * @param ymid - ID único do usuário
 * @returns Status da verificação
 */
export async function checkStats(ymid: string): Promise<CheckStatsResponse> {
  const data = await fetchMonetagStats(ymid);

  if (!data.success) {
    return {
      success: false,
      impressions: 0,
      clicks: 0,
      isReady: false,
      message: data.message || "Falha ao buscar dados",
    };
  }

  const impressions = parseInt(String(data.total_impressions)) || 0;
  const clicks = parseInt(String(data.total_clicks)) || 0;

  const isReady =
    impressions >= POSTBACK_CONFIG.MIN_IMPRESSIONS &&
    clicks >= POSTBACK_CONFIG.MIN_CLICKS;

  return {
    success: true,
    impressions,
    clicks,
    isReady,
  };
}

/**
 * Verifica se o postback foi resetado
 * Isso acontece quando:
 * 1. API retorna erro (success: false)
 * 2. Stats caem abaixo do mínimo necessário
 * @param ymid - ID único do usuário
 * @returns Informação sobre reset
 */
export async function checkReset(ymid: string): Promise<CheckResetResponse> {
  const data = await fetchMonetagStats(ymid);

  // Se API retorna erro, foi resetado
  if (!data.success) {
    return {
      wasReset: true,
      reason: "api_error",
      message: "API retornou erro - postback foi resetado",
    };
  }

  const impressions = parseInt(String(data.total_impressions)) || 0;
  const clicks = parseInt(String(data.total_clicks)) || 0;

  // Se stats caíram abaixo do mínimo, foi resetado
  if (
    impressions < POSTBACK_CONFIG.MIN_IMPRESSIONS ||
    clicks < POSTBACK_CONFIG.MIN_CLICKS
  ) {
    return {
      wasReset: true,
      reason: "stats_below_threshold",
      message: `Stats abaixo do mínimo (${impressions}/${POSTBACK_CONFIG.MIN_IMPRESSIONS} impressões, ${clicks}/${POSTBACK_CONFIG.MIN_CLICKS} cliques)`,
    };
  }

  // Tudo normal
  return {
    wasReset: false,
  };
}

/**
 * Valida se um YMID tem formato correto
 * @param ymid - ID a validar
 * @returns true se válido
 */
export function isValidYmid(ymid: string): boolean {
  return /^YMID_\d+_[a-z0-9]{6}$/.test(ymid);
}
