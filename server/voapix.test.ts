import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock axios
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

import axios from "axios";
const mockedAxios = vi.mocked(axios);

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("voapix.earnPoints", () => {
  it("sends correct parameters and returns success response", async () => {
    const mockResponse = {
      data: {
        success: true,
        message: "Pontos atualizados com sucesso",
        newBalance: 0.0035,
        dailyPoints: 7,
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.voapix.earnPoints({
      email: "test@example.com",
      points: 5,
      deviceId: "abc123",
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Pontos atualizados com sucesso");
    expect(result.newBalance).toBe(0.0035);
    expect(result.dailyPoints).toBe(7);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://voapix.thm.app.br/api/earn_points.php",
      expect.stringContaining("email=test%40example.com"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "okhttp/4.10.0",
        }),
      })
    );
  });

  it("handles API failure gracefully", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.voapix.earnPoints({
      email: "test@example.com",
      points: 10,
      deviceId: "abc123",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Network Error");
    expect(result.newBalance).toBe(0);
    expect(result.dailyPoints).toBe(0);
  });

  it("validates email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.voapix.earnPoints({
        email: "invalid-email",
        points: 5,
        deviceId: "abc123",
      })
    ).rejects.toThrow();
  });

  it("validates points range (1-200)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.voapix.earnPoints({
        email: "test@example.com",
        points: 0,
        deviceId: "abc123",
      })
    ).rejects.toThrow();

    await expect(
      caller.voapix.earnPoints({
        email: "test@example.com",
        points: 201,
        deviceId: "abc123",
      })
    ).rejects.toThrow();
  });

  it("validates deviceId is not empty", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.voapix.earnPoints({
        email: "test@example.com",
        points: 5,
        deviceId: "",
      })
    ).rejects.toThrow();
  });
});

describe("voapix.getUserData", () => {
  it("returns user data on success", async () => {
    const mockResponse = {
      data: {
        success: true,
        balance: 0.5,
        dailyPoints: 100,
        email: "test@example.com",
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.voapix.getUserData({
      email: "test@example.com",
      deviceId: "abc123",
    });

    expect(result.success).toBe(true);
  });

  it("handles error gracefully", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Timeout"));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.voapix.getUserData({
      email: "test@example.com",
      deviceId: "abc123",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Timeout");
  });
});
