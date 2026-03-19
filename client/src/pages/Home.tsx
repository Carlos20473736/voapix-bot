import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Square,
  Zap,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Activity,
  Trash2,
  RotateCcw,
  Mail,
  Smartphone,
  Timer,
  Coins,
} from "lucide-react";
import { useVoaPixBot, type LogEntry } from "@/hooks/useVoaPixBot";
import { PostbackYmidDialog } from "@/components/PostbackYmidDialog";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663455611654/EnXE8avwsjCef5Fmj8mAhm/hero-bg-9pwewbMFjybHAWzqBU6cep.webp";
const GOLDEN_BIRD = "https://d2xsxph8kpxj0f.cloudfront.net/310519663455611654/EnXE8avwsjCef5Fmj8mAhm/golden-bird-HJKpG8bsjvFAoUekLJn72K.webp";
const VOAPIX_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663455611654/EnXE8avwsjCef5Fmj8mAhm/voapix-icon_563aaf3e.png";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function LogItem({ log }: { log: LogEntry }) {
  const timeStr = log.timestamp.toLocaleTimeString("pt-BR");
  const iconMap = {
    success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />,
    info: <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
  };
  const colorMap = {
    success: "text-emerald-300",
    error: "text-red-300",
    info: "text-sky-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors font-mono text-xs"
    >
      {iconMap[log.type]}
      <span className="text-muted-foreground shrink-0">[{timeStr}]</span>
      <span className={colorMap[log.type]}>{log.message}</span>
    </motion.div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(30);
  const [maxPoints, setMaxPoints] = useState(50);
  const [showYmidDialog, setShowYmidDialog] = useState(true);
  const [botVerified, setBotVerified] = useState(false);

  const {
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
  } = useVoaPixBot();

  const logEndRef = useRef<HTMLDivElement>(null);

  const successRate = useMemo(() => {
    if (totalRequests === 0) return 0;
    return Math.round((successCount / totalRequests) * 100);
  }, [successCount, totalRequests]);

  const handleToggleBot = () => {
    if (isRunning) {
      stopBot();
      toast.info("Bot parado");
      return;
    }

    if (!email.trim()) {
      toast.error("Informe o e-mail");
      return;
    }
    if (!deviceId.trim()) {
      toast.error("Informe o Device ID");
      return;
    }

    startBot({
      email: email.trim(),
      deviceId: deviceId.trim(),
      intervalSeconds,
      maxPoints,
    });
    toast.success("Bot iniciado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Postback YMID Dialog */}
      <PostbackYmidDialog
        isOpen={showYmidDialog && !botVerified}
        onClose={() => setShowYmidDialog(false)}
        onBotUnlocked={() => {
          setBotVerified(true);
          setShowYmidDialog(false);
          toast.success("Bot verificado com sucesso!");
        }}
        onError={(error) => {
          toast.error(error);
        }}
      />
      {/* Background */}
      {showYmidDialog && !botVerified && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      )}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-30 pointer-events-none"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/60">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={VOAPIX_ICON}
                alt="VoaPix"
                className="w-10 h-10 rounded-lg shadow-lg"
              />
              <div>
                <h1 className="font-heading text-xl font-bold gold-text">
                  VoaPix Bot
                </h1>
                <p className="text-xs text-muted-foreground">
                  Automacao de pontos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isRunning && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-gold" />
                  <span className="text-sm text-emerald-400 font-medium">
                    Ativo
                  </span>
                </motion.div>
              )}
              <img
                src={GOLDEN_BIRD}
                alt="Golden Bird"
                className="w-12 h-12 animate-float"
              />
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <main className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-5 space-y-5">
              {/* Config Card */}
              <Card className="glass-card gold-glow border-gold/15">
                <CardHeader className="pb-4">
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Configuracao
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 text-primary" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isRunning}
                      className="bg-secondary/50 border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
                    />
                  </div>

                  {/* Device ID */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="deviceId"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Smartphone className="w-4 h-4 text-primary" />
                      Device ID
                    </Label>
                    <Input
                      id="deviceId"
                      type="text"
                      placeholder="cff751fa2bfb81d3"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      disabled={isRunning}
                      className="bg-secondary/50 border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50 font-mono text-sm"
                    />
                  </div>

                  <Separator className="bg-border/30" />

                  {/* Interval Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Timer className="w-4 h-4 text-primary" />
                        Intervalo
                      </Label>
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {formatTime(intervalSeconds)}
                      </Badge>
                    </div>
                    <Slider
                      value={[intervalSeconds]}
                      onValueChange={([val]) => setIntervalSeconds(val)}
                      min={10}
                      max={180}
                      step={5}
                      disabled={isRunning}
                      className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary/50 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-primary/20"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10s</span>
                      <span>1min</span>
                      <span>2min</span>
                      <span>3min</span>
                    </div>
                  </div>

                  {/* Max Points Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Coins className="w-4 h-4 text-primary" />
                        Pontuacao Maxima
                      </Label>
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        1 - {maxPoints}
                      </Badge>
                    </div>
                    <Slider
                      value={[maxPoints]}
                      onValueChange={([val]) => setMaxPoints(val)}
                      min={1}
                      max={200}
                      step={1}
                      disabled={isRunning}
                      className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary/50 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-primary/20"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>50</span>
                      <span>100</span>
                      <span>150</span>
                      <span>200</span>
                    </div>
                  </div>

                  <Separator className="bg-border/30" />

                  {/* Start/Stop Button */}
                  <Button
                    onClick={handleToggleBot}
                    size="lg"
                    className={`w-full font-heading font-bold text-base transition-all duration-300 ${
                      isRunning
                        ? "bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/20"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Square className="w-5 h-5 mr-2" />
                        Parar Bot
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Iniciar Bot
                      </>
                    )}
                  </Button>

                  {/* Countdown */}
                  <AnimatePresence>
                    {isRunning && nextRunIn > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary/50"
                      >
                        <Clock className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                        <span className="text-sm text-muted-foreground">
                          Proxima requisicao em{" "}
                          <span className="font-mono text-primary font-bold">
                            {formatTime(nextRunIn)}
                          </span>
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stats & Logs */}
            <div className="lg:col-span-7 space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={<Target className="w-4 h-4" />}
                  label="Requisicoes"
                  value={totalRequests.toString()}
                  color="text-sky-400"
                />
                <StatCard
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  label="Sucesso"
                  value={`${successCount} (${successRate}%)`}
                  color="text-emerald-400"
                />
                <StatCard
                  icon={<XCircle className="w-4 h-4" />}
                  label="Falhas"
                  value={failCount.toString()}
                  color="text-red-400"
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Pts Diarios"
                  value={lastDailyPoints !== null ? lastDailyPoints.toString() : "--"}
                  color="text-primary"
                />
              </div>

              {/* Balance Card */}
              <Card className="glass-card border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Saldo Atual
                        </p>
                        <p className="text-2xl font-heading font-bold gold-text">
                          R${" "}
                          {lastBalance !== null
                            ? lastBalance.toFixed(4)
                            : "0.0000"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetStats}
                      className="text-xs border-border/50 hover:bg-secondary/50"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Resetar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Logs Card */}
              <Card className="glass-card border-border/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Console de Logs
                      <Badge
                        variant="secondary"
                        className="text-xs bg-secondary/50"
                      >
                        {logs.length}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearLogs}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Limpar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[360px] rounded-lg bg-black/30 border border-border/20 p-2">
                    {logs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 py-16">
                        <Activity className="w-8 h-8 mb-2" />
                        <p className="text-sm">
                          Nenhum log ainda. Inicie o bot para comecar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <AnimatePresence initial={false}>
                          {logs.map((log) => (
                            <LogItem key={log.id} log={log} />
                          ))}
                        </AnimatePresence>
                        <div ref={logEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 mt-8">
          <div className="container py-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>VoaPix Bot v1.0</span>
            <span>Automacao de pontos VoaPix</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="glass-card border-border/20">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={color}>{icon}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-lg font-heading font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
