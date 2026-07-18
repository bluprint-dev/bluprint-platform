"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import RewardPoolBanner from "@/components/RewardPoolBanner";
import GameLeaderboard from "@/components/GameLeaderboard";

type Phase = "idle" | "playing" | "over";
type ObstacleType = "rug" | "thief" | "eye";

interface Obstacle {
  type: ObstacleType;
  x: number;
  width: number;
  height: number;
  passed: boolean;
  floatPhase: number;
}

interface SubmitResult {
  status: "verified" | "flagged" | "rejected";
  reason?: string;
  score?: number;
}

const CANVAS_W = 900;
const CANVAS_H = 280;
const GROUND_Y = 220;
const DINO_X = 90;
const DINO_W = 46;
const DINO_H = 46;
const GRAVITY = 0.9;
const JUMP_VELOCITY = -14.5;
const BASE_SPEED = 6.2;

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatRemaining(untilIso: string, nowMs: number): string {
  const diff = new Date(untilIso).getTime() - nowMs;
  if (diff <= 0) return "0h 0m";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function AxorRunnerPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dinoYRef = useRef(GROUND_Y - DINO_H);
  const dinoVyRef = useRef(0);
  const groundedRef = useRef(true);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const spawnTimerRef = useRef(0);
  const speedRef = useRef(BASE_SPEED);
  const elapsedMsRef = useRef(0);
  const frameCountRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const scoreRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [cooldownUntil]);

  useEffect(() => {
    if (cooldownUntil && new Date(cooldownUntil).getTime() <= nowTick) {
      setCooldownUntil(null);
    }
  }, [cooldownUntil, nowTick]);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, "#150f1e");
    grad.addColorStop(1, "#0a0a0c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = "rgba(212,175,122,0.35)";
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137) % CANVAS_W;
      const sy = (i * 71) % (GROUND_Y - 20);
      ctx.fillRect(sx, sy, 2, 2);
    }

    ctx.strokeStyle = "#D4AF7A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();
  }, []);

  const drawDino = useCallback((ctx: CanvasRenderingContext2D, y: number, frame: number) => {
    const x = DINO_X;
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "#22C55E";
    ctx.beginPath();
    ctx.moveTo(-4, 18);
    ctx.lineTo(-16, 10);
    ctx.lineTo(-4, 26);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#4ADE80";
    ctx.beginPath();
    ctx.roundRect(0, 4, 32, 28, 10);
    ctx.fill();

    ctx.fillStyle = "#4ADE80";
    ctx.beginPath();
    ctx.roundRect(20, -8, 24, 22, 8);
    ctx.fill();

    ctx.fillStyle = "#0A0A0C";
    ctx.beginPath();
    ctx.arc(38, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#22C55E";
    const legOffset = groundedRef.current ? (Math.floor(frame / 6) % 2 === 0 ? 0 : 6) : 3;
    ctx.fillRect(4, 30, 8, 12 - legOffset * 0.4);
    ctx.fillRect(18, 30, 8, 12 - (6 - legOffset) * 0.4);

    ctx.restore();
  }, []);

  const drawRug = useCallback((ctx: CanvasRenderingContext2D, ob: Obstacle) => {
    const { x, width, height } = ob;
    const y = GROUND_Y - height;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#F97316";
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.2);
    ctx.quadraticCurveTo(-width * 0.05, height * 0.6, width * 0.15, height);
    ctx.lineTo(width * 0.85, height);
    ctx.quadraticCurveTo(width * 1.05, height * 0.6, width * 0.9, height * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#7C2D12";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.15, height * 0.22);
    ctx.lineTo(width * 0.85, height * 0.22);
    ctx.stroke();
    ctx.fillStyle = "#7C2D12";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("$", width / 2, height * 0.7);
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 2.5;
    const ex = width * 0.32;
    const ey = height * 0.42;
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey - 4);
    ctx.lineTo(ex + 4, ey + 4);
    ctx.moveTo(ex + 4, ey - 4);
    ctx.lineTo(ex - 4, ey + 4);
    ctx.stroke();
    ctx.restore();
  }, []);

  const drawThief = useCallback((ctx: CanvasRenderingContext2D, ob: Obstacle) => {
    const { x, width, height } = ob;
    const y = GROUND_Y - height;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#312E81";
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0A0A0C";
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.28, width * 0.22, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(width / 2 - 4, height * 0.28, 1.8, 0, Math.PI * 2);
    ctx.arc(width / 2 + 4, height * 0.28, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FACC15";
    ctx.beginPath();
    ctx.arc(width * 0.82, height * 0.6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#A16207";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }, []);

  const drawEye = useCallback((ctx: CanvasRenderingContext2D, ob: Obstacle) => {
    const { x, width, height, floatPhase } = ob;
    const bob = Math.sin(floatPhase) * 4;
    const y = GROUND_Y - height + bob;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const r = width / 2;
    ctx.save();
    ctx.shadowColor = "rgba(153,69,255,0.7)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#F5F5F4";
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#9945FF";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0A0C";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(239,68,68,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx - r * 0.4, cy - r * 0.2);
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(cx + r * 0.4, cy + r * 0.2);
    ctx.stroke();
    ctx.restore();
  }, []);

  const drawObstacle = useCallback(
    (ctx: CanvasRenderingContext2D, ob: Obstacle) => {
      if (ob.type === "rug") drawRug(ctx, ob);
      else if (ob.type === "thief") drawThief(ctx, ob);
      else drawEye(ctx, ob);
    },
    [drawRug, drawThief, drawEye]
  );

  const resetGame = useCallback(() => {
    dinoYRef.current = GROUND_Y - DINO_H;
    dinoVyRef.current = 0;
    groundedRef.current = true;
    obstaclesRef.current = [];
    spawnTimerRef.current = 900;
    speedRef.current = BASE_SPEED;
    elapsedMsRef.current = 0;
    frameCountRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setResult(null);
    setErrorMsg(null);
  }, []);

  const endGame = useCallback(async () => {
    phaseRef.current = "over";
    setPhase("over");
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    const token = sessionToken;
    const wallet = publicKey?.toBase58();
    if (!token || !wallet) return;

    setBusy(true);
    try {
      const res = await fetch("/api/games/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token, wallet, score: scoreRef.current }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ status: data.status, reason: data.reason, score: scoreRef.current });
        if (data.status === "verified") setRefreshKey((k) => k + 1);
      } else {
        setResult({ status: "rejected", reason: data.reason ?? data.error });
      }
    } catch {
      setErrorMsg("Couldn't submit score, check your connection.");
    } finally {
      setBusy(false);
    }
  }, [sessionToken, publicKey]);

  const tick = useCallback(
    (ts: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 16.67, 2.5);
      lastTsRef.current = ts;

      if (phaseRef.current !== "playing") return;

      elapsedMsRef.current += dt * 16.67;
      frameCountRef.current += 1;

      dinoVyRef.current += GRAVITY * dt;
      dinoYRef.current += dinoVyRef.current * dt;
      if (dinoYRef.current >= GROUND_Y - DINO_H) {
        dinoYRef.current = GROUND_Y - DINO_H;
        dinoVyRef.current = 0;
        groundedRef.current = true;
      } else {
        groundedRef.current = false;
      }

      speedRef.current = Math.min(BASE_SPEED + elapsedMsRef.current / 9000, 13.5);

      spawnTimerRef.current -= dt * 16.67;
      if (spawnTimerRef.current <= 0) {
        const types: ObstacleType[] = ["rug", "thief", "eye"];
        const type = types[Math.floor(Math.random() * types.length)];
        const height = type === "eye" ? 34 : type === "thief" ? 46 : 38;
        const width = type === "eye" ? 34 : type === "thief" ? 32 : 40;
        obstaclesRef.current.push({
          type,
          x: CANVAS_W + 20,
          width,
          height,
          passed: false,
          floatPhase: Math.random() * Math.PI * 2,
        });
        spawnTimerRef.current = 1100 + Math.random() * 700 - speedRef.current * 20;
      }

      const dinoBox = {
        x: DINO_X + 6,
        y: dinoYRef.current + 4,
        w: DINO_W - 14,
        h: DINO_H - 8,
      };

      let collided = false;
      for (const ob of obstaclesRef.current) {
        ob.x -= speedRef.current * dt;
        ob.floatPhase += 0.05 * dt;

        const obY =
          ob.type === "eye"
            ? GROUND_Y - ob.height + Math.sin(ob.floatPhase) * 4
            : GROUND_Y - ob.height;

        const overlapX = dinoBox.x < ob.x + ob.width - 6 && dinoBox.x + dinoBox.w > ob.x + 6;
        const overlapY = dinoBox.y < obY + ob.height - 4 && dinoBox.y + dinoBox.h > obY + 4;
        if (overlapX && overlapY) collided = true;
      }
      obstaclesRef.current = obstaclesRef.current.filter((ob) => ob.x > -60);

      const newScore = Math.floor(elapsedMsRef.current / 100);
      if (newScore !== scoreRef.current) {
        scoreRef.current = newScore;
        setScore(newScore);
      }

      drawBackground(ctx);
      for (const ob of obstaclesRef.current) drawObstacle(ctx, ob);
      drawDino(ctx, dinoYRef.current, frameCountRef.current);

      if (collided) {
        endGame();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [drawBackground, drawDino, drawObstacle, endGame]
  );

  const jump = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (groundedRef.current) {
      dinoVyRef.current = JUMP_VELOCITY;
      groundedRef.current = false;
    }
  }, []);

  const startGame = useCallback(async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/games/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58(), gameId: "axor_runner" }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.error === "ALREADY_PLAYED_TODAY" && data.nextAvailableAt) {
          setCooldownUntil(data.nextAvailableAt);
          setNowTick(Date.now());
        } else {
          setErrorMsg(data.error ?? "Couldn't start session.");
        }
        setBusy(false);
        return;
      }
      setSessionToken(data.sessionToken);
      resetGame();
      setPhase("playing");
      phaseRef.current = "playing";
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);

      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        fetch("/api/games/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: data.sessionToken }),
        }).catch(() => {});
      }, 2000);
    } catch {
      setErrorMsg("Couldn't connect to server.");
    } finally {
      setBusy(false);
    }
  }, [connected, publicKey, setVisible, resetGame, tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (phase !== "playing") {
      drawBackground(ctx);
      drawDino(ctx, GROUND_Y - DINO_H, 0);
    }
  }, [phase, drawBackground, drawDino]);

  const inCooldown = !!cooldownUntil && new Date(cooldownUntil).getTime() > nowTick;

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "32px 16px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: 26,
              fontWeight: 900,
              color: "#F2E4C2",
              margin: 0,
            }}
          >
            Axor Runner
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(242,228,194,0.5)" }}>
            Press Space / Up Arrow / tap to jump. Dodge rug pullers, thieves, and evil eyes.
          </p>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            color: "#D4AF7A",
            background: "rgba(212,175,122,0.08)",
            border: "1px solid rgba(212,175,122,0.2)",
            borderRadius: 10,
            padding: "8px 14px",
          }}
        >
          {connected && publicKey ? shortenAddress(publicKey.toBase58()) : "Wallet not connected"}
        </div>
      </div>

      <RewardPoolBanner gameId="axor_runner" />

      <div
        style={{
          position: "relative",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(212,175,122,0.2)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        }}
        onClick={jump}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: "100%", height: "auto", display: "block", cursor: phase === "playing" ? "pointer" : "default" }}
        />

        <div
          style={{
            position: "absolute",
            top: 14,
            right: 18,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 20,
            fontWeight: 700,
            color: "#F2E4C2",
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          {String(score).padStart(5, "0")}
        </div>

        {phase !== "playing" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              background: "rgba(10,10,12,0.55)",
              backdropFilter: "blur(2px)",
              textAlign: "center",
              padding: 20,
            }}
          >
            {phase === "idle" && (
              <>
                {inCooldown ? (
                  <>
                    <p style={{ margin: 0, color: "#F2E4C2", fontSize: 16, fontWeight: 700 }}>
                      Already played today
                    </p>
                    <p style={{ margin: 0, color: "#D4AF7A", fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono), monospace" }}>
                      Next attempt in {formatRemaining(cooldownUntil!, nowTick)}
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, color: "#F2E4C2", fontSize: 15, maxWidth: 380 }}>
                      {connected
                        ? "One attempt per 24 hours. Start when you're ready."
                        : "Connect your wallet to play."}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startGame();
                      }}
                      disabled={busy}
                      style={{
                        padding: "12px 28px",
                        borderRadius: 999,
                        border: "none",
                        background: "linear-gradient(135deg,#D4AF7A,#E8C989)",
                        color: "#0A0A0C",
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: busy ? "wait" : "pointer",
                        opacity: busy ? 0.7 : 1,
                      }}
                    >
                      {busy ? "Loading..." : connected ? "Start" : "Connect Wallet"}
                    </button>
                    {errorMsg && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{errorMsg}</p>}
                  </>
                )}
              </>
            )}

            {phase === "over" && (
              <>
                <p style={{ margin: 0, color: "#F2E4C2", fontSize: 22, fontWeight: 800 }}>
                  Game over — Score: {score}
                </p>
                {busy && <p style={{ color: "rgba(242,228,194,0.6)", fontSize: 13, margin: 0 }}>Verifying score...</p>}
                {!busy && result?.status === "verified" && (
                  <p style={{ color: "#4ADE80", fontSize: 14, margin: 0 }}>Verified and added to the leaderboard.</p>
                )}
                {!busy && result?.status === "flagged" && (
                  <p style={{ color: "#FACC15", fontSize: 14, margin: 0 }}>
                    Flagged for review ({result.reason}). Awaiting admin approval.
                  </p>
                )}
                {!busy && result?.status === "rejected" && (
                  <p style={{ color: "#EF4444", fontSize: 14, margin: 0 }}>
                    Rejected ({result.reason}). Not saved.
                  </p>
                )}
                {!busy && errorMsg && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{errorMsg}</p>}
                <p style={{ margin: 0, color: "rgba(242,228,194,0.45)", fontSize: 12 }}>
                  Come back in 24 hours for your next attempt.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <GameLeaderboard gameId="axor_runner" refreshKey={refreshKey} />
    </div>
  );
}