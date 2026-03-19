import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import axios from "axios";
import { generateYmid, checkStats, checkReset, isValidYmid } from "./postback";
import { CheckStatsResponse, CheckResetResponse, GenerateYmidResponse } from "./postback.constants";

const VOAPIX_API_BASE = "https://voapix.thm.app.br/api";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  postback: router({
    /**
     * Gera um novo YMID para o usuário
     * Este ID será usado para rastrear tarefas no Young Money
     */
    generateYmid: publicProcedure.mutation(async (): Promise<GenerateYmidResponse> => {
      const ymid = generateYmid();
      return {
        ymid,
        youngMoneyUrl: "https://youngmoney-bot-production-110d.up.railway.app/",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
      };
    }),

    /**
     * Verifica o status das tarefas no Young Money
     * Retorna impressões, cliques e se o bot está pronto para liberar
     */
    checkStats: publicProcedure
      .input(z.object({ ymid: z.string().min(1) }))
      .query(async ({ input }): Promise<CheckStatsResponse> => {
        if (!isValidYmid(input.ymid)) {
          return {
            success: false,
            impressions: 0,
            clicks: 0,
            isReady: false,
            message: "YMID inválido",
          };
        }

        return await checkStats(input.ymid);
      }),

    /**
     * Verifica se o postback foi resetado
     * Isso monitora se as tarefas foram limpas ou se o usuário perdeu acesso
     */
    checkReset: publicProcedure
      .input(z.object({ ymid: z.string().min(1) }))
      .query(async ({ input }): Promise<CheckResetResponse> => {
        if (!isValidYmid(input.ymid)) {
          return {
            wasReset: true,
            reason: "unknown",
            message: "YMID inválido",
          };
        }

        return await checkReset(input.ymid);
      }),
  }),

  voapix: router({
    earnPoints: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          points: z.number().int().min(1).max(200),
          deviceId: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const params = new URLSearchParams();
          params.append("email", input.email);
          params.append("points", String(input.points));
          params.append("device_id", input.deviceId);

          const response = await axios.post(
            `${VOAPIX_API_BASE}/earn_points.php`,
            params.toString(),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "okhttp/4.10.0",
                "Accept-Encoding": "gzip",
              },
              timeout: 15000,
            }
          );

          return {
            success: response.data?.success ?? false,
            message: response.data?.message ?? "Sem resposta",
            newBalance: response.data?.newBalance ?? 0,
            dailyPoints: response.data?.dailyPoints ?? 0,
          };
        } catch (error: any) {
          const msg = error?.response?.data?.message || error?.message || "Erro desconhecido";
          return {
            success: false,
            message: msg,
            newBalance: 0,
            dailyPoints: 0,
          };
        }
      }),

    getUserData: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          deviceId: z.string().min(1),
        })
      )
      .query(async ({ input }) => {
        try {
          const params = new URLSearchParams();
          params.append("email", input.email);
          params.append("device_id", input.deviceId);

          const response = await axios.post(
            `${VOAPIX_API_BASE}/get_user_data.php`,
            params.toString(),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "okhttp/4.10.0",
                "Accept-Encoding": "gzip",
              },
              timeout: 15000,
            }
          );

          return response.data;
        } catch (error: any) {
          return { success: false, message: error?.message || "Erro ao buscar dados" };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
