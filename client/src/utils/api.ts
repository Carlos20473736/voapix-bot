/**
 * Cliente tRPC vanilla para chamadas imperativas (fora de componentes React)
 * Usado pelo usePostback.ts para chamadas como api.postback.generateYmid.mutate()
 */
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";
import superjson from "superjson";

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
