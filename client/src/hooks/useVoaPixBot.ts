import { trpc } from "@/lib/trpc";
import { useCallback, useRef, useState } from "react";

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: "success" | "error" | "info";
  message: string;
  points?: number;
  balance?: number;
  dailyPoints?: number;
}

export interface BotConfig {
  email: string;
  deviceId: string;
  intervalSeconds: number;
  maxPoints: number;
}

export function useVoaPixBot() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [lastBalance, setLastBalance] = useState<number | null>(null);
  const [lastDailyPoints, setLastDailyPoints] = useState<number | null>(null);
  const [nextRunIn, setNextRunIn] = useState<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const configRef = useRef<BotConfig | null>(null);

  const earnPointsMutation = trpc.voapix.earnPoints.useMutation();

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    const newEntry: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setLogs((prev) => [newEntry, ...prev].slice(0, 500));
  }, []);

  const getRandomPoints = useCallback((maxPoints: number) => {
    return Math.floor(Math.random() * maxPoints) + 1;
  }, []);

  const executeRequest = useCallback(async () => {
    const config = configRef.current;
    if (!config) return;

    const points = getRandomPoints(config.maxPoints);

    try {
      const result = await earnPointsMutation.mutateAsync({
        email: config.email,
        points,
        deviceId: config.deviceId,
      });

      setTotalRequests((prev) => prev + 1);

      if (result.success) {
        setSuccessCount((prev) => prev + 1);
        setLastBalance(result.newBalance);
        setLastDailyPoints(result.dailyPoints);
        addLog({
          type: "success",
          message: `+${points} pts | Saldo: R$ ${result.newBalance.toFixed(4)} | Diario: ${result.dailyPoints}`,
          points,
          balance: result.newBalance,
          dailyPoints: result.dailyPoints,
        });
      } else {
        setFailCount((prev) => prev + 1);
        addLog({
          type: "error",
          message: `Falha: ${result.message}`,
          points,
        });
      }
    } catch (error: any) {
      setTotalRequests((prev) => prev + 1);
      setFailCount((prev) => prev + 1);
      addLog({
        type: "error",
        message: `Erro: ${error?.message || "Erro desconhecido"}`,
        points,
      });
    }
  }, [earnPointsMutation, getRandomPoints, addLog]);

  const startBot = useCallback(
    (config: BotConfig) => {
      if (isRunning) return;

      configRef.current = config;
      setIsRunning(true);

      addLog({
        type: "info",
        message: `Bot iniciado | Email: ${config.email} | Intervalo: ${config.intervalSeconds}s | Max pts: ${config.maxPoints}`,
      });

      // Execute immediately
      executeRequest();

      // Start countdown
      let countdown = config.intervalSeconds;
      setNextRunIn(countdown);

      countdownRef.current = setInterval(() => {
        countdown--;
        setNextRunIn(countdown);
        if (countdown <= 0) {
          countdown = config.intervalSeconds;
          setNextRunIn(countdown);
        }
      }, 1000);

      // Set interval for subsequent requests
      intervalRef.current = setInterval(() => {
        executeRequest();
      }, config.intervalSeconds * 1000);
    },
    [isRunning, executeRequest, addLog]
  );

  const stopBot = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsRunning(false);
    setNextRunIn(0);
    addLog({
      type: "info",
      message: "Bot parado pelo usuario",
    });
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const resetStats = useCallback(() => {
    setTotalRequests(0);
    setSuccessCount(0);
    setFailCount(0);
    setLastBalance(null);
    setLastDailyPoints(null);
  }, []);

  return {
    isRunning,
    logs,
    totalRequests,
    successCount,
    failCount,
    lastBalance,
    lastDailyPoints,
    nextRunIn,
    startBot,
    stopBot,
    clearLogs,
    resetStats,
  };
}
