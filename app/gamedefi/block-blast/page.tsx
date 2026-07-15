"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import RewardPoolBanner from "@/components/RewardPoolBanner";
import GameLeaderboard from "@/components/GameLeaderboard";

type Phase = "idle" | "playing" | "over";
type BoardCell = string | null;
type Board = BoardCell[][];
type PieceShape = [number, number][];

interface Piece {
  id: string;
  shape: PieceShape;
  color: string;
}

interface SubmitResult {
  status: "verified" | "flagged" | "rejected";
  reason?: string;
  score?: number;
}

const BOARD_SIZE = 8;
const DRAG_LIFT = 60;

const COLORS = ["#F97316", "#EF4444", "#EAB308", "#22C55E", "#3B82F6", "#9945FF", "#EC4899", "#14B8A6"];

const SHAPES: PieceShape[] = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 1], [1, 1], [2, 0], [2, 1]],
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
];

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<BoardCell>(BOARD_SIZE).fill(null));
}

function randomPiece(): Piece {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { id: crypto.randomUUID(), shape, color };
}

function canPlace(board: Board, shape: PieceShape, row: number, col: number): boolean {
  for (const [dr, dc] of shape) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] != null) return false;
  }
  return true;
}

function canPlaceAnywhere(board: Board, shape: PieceShape): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (canPlace(board, shape, r, c)) return true;
    }
  }
  return false;
}

function placePiece(board: Board, shape: PieceShape, row: number, col: number, color: string): Board {
  const next = board.map((r) => [...r]);
  for (const [dr, dc] of shape) {
    next[row + dr][col + dc] = color;
  }
  return next;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const fullRows: number[] = [];
  const fullCols: number[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every((cell) => cell != null)) fullRows.push(r);
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board.every((row) => row[c] != null)) fullCols.push(c);
  }

  if (fullRows.length === 0 && fullCols.length === 0) {
    return { board, cleared: 0 };
  }

  const next = board.map((r) => [...r]);
  for (const r of fullRows) {
    for (let c = 0; c < BOARD_SIZE; c++) next[r][c] = null;
  }
  for (const c of fullCols) {
    for (let r = 0; r < BOARD_SIZE; r++) next[r][c] = null;
  }

  return { board: next, cleared: fullRows.length + fullCols.length };
}

export default function BlockBlastPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const boardElRef = useRef<HTMLDivElement>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [tray, setTray] = useState<(Piece | null)[]>([null, null, null]);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<{ row: number; col: number } | null>(null);

  const phaseRef = useRef<Phase>("idle");
  const boardLiveRef = useRef<Board>(board);
  const trayLiveRef = useRef<(Piece | null)[]>(tray);
  const hoverLiveRef = useRef<{ row: number; col: number } | null>(null);
  const scoreRef = useRef(0);
  const sessionTokenRef = useRef<string | null>(null);

  phaseRef.current = phase;
  boardLiveRef.current = board;
  trayLiveRef.current = tray;
  hoverLiveRef.current = hoverAnchor;
  sessionTokenRef.current = sessionToken;

  const endGame = useCallback(async () => {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "over";
    setPhase("over");
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    const token = sessionTokenRef.current;
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
  }, [publicKey]);

  // game-over watcher: whenever board/tray changes, check if any tray piece fits anywhere
  useEffect(() => {
    if (phase !== "playing") return;
    const hasAnyPiece = tray.some((p) => p != null);
    if (!hasAnyPiece) return;
    const anyPlaceable = tray.some((p) => p != null && canPlaceAnywhere(board, p.shape));
    if (!anyPlaceable) {
      endGame();
    }
  }, [board, tray, phase, endGame]);

  const commitPlacement = useCallback((index: number, piece: Piece, row: number, col: number) => {
    const placedBoard = placePiece(boardLiveRef.current, piece.shape, row, col, piece.color);
    const { board: clearedBoard, cleared } = clearLines(placedBoard);
    const gain = piece.shape.length + (cleared > 0 ? 10 * cleared * cleared : 0);

    setBoard(clearedBoard);
    setScore((s) => {
      const ns = s + gain;
      scoreRef.current = ns;
      return ns;
    });
    setTray((prev) => {
      const next = [...prev];
      next[index] = null;
      if (next.every((p) => p == null)) {
        return [randomPiece(), randomPiece(), randomPiece()];
      }
      return next;
    });
  }, []);

  // pointer drag handling
  useEffect(() => {
    if (draggingIndex == null) return;

    function handleMove(e: PointerEvent) {
      const rect = boardElRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cellSize = rect.width / BOARD_SIZE;
      const col = Math.floor((e.clientX - rect.left) / cellSize);
      const row = Math.floor((e.clientY - rect.top - DRAG_LIFT) / cellSize);
      setHoverAnchor({ row, col });
    }

    function handleUp() {
      const idx = draggingIndex;
      const anchor = hoverLiveRef.current;
      const piece = idx != null ? trayLiveRef.current[idx] : null;
      if (idx != null && piece && anchor) {
        if (canPlace(boardLiveRef.current, piece.shape, anchor.row, anchor.col)) {
          commitPlacement(idx, piece, anchor.row, anchor.col);
        }
      }
      setDraggingIndex(null);
      setHoverAnchor(null);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [draggingIndex, commitPlacement]);

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
        body: JSON.stringify({ wallet: publicKey.toBase58(), gameId: "block_blast" }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error ?? "Couldn't start session.");
        setBusy(false);
        return;
      }
      setSessionToken(data.sessionToken);
      setBoard(emptyBoard());
      setTray([randomPiece(), randomPiece(), randomPiece()]);
      setScore(0);
      scoreRef.current = 0;
      setResult(null);
      setErrorMsg(null);
      setPhase("playing");
      phaseRef.current = "playing";

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
  }, [connected, publicKey, setVisible]);

  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  const highlightMap = new Map<string, boolean>();
  if (draggingIndex != null && hoverAnchor) {
    const piece = tray[draggingIndex];
    if (piece) {
      for (const [dr, dc] of piece.shape) {
        const r = hoverAnchor.row + dr;
        const c = hoverAnchor.col + dc;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const valid = canPlace(board, piece.shape, hoverAnchor.row, hoverAnchor.col);
          highlightMap.set(`${r}-${c}`, valid);
        }
      }
    }
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "32px 16px 80px" }}>
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
            🧩 Block Blast
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(242,228,194,0.5)" }}>
            Drag pieces onto the board. Clear full rows or columns to score.
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

      <RewardPoolBanner gameId="block_blast" />

      <div
        style={{
          position: "relative",
          borderRadius: 18,
          padding: 16,
          border: "1px solid rgba(212,175,122,0.2)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          background: "#0d0b10",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 20,
            fontWeight: 700,
            color: "#F2E4C2",
            marginBottom: 10,
          }}
        >
          {String(score).padStart(5, "0")}
        </div>

        <div
          ref={boardElRef}
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
            aspectRatio: "1 / 1",
            width: "100%",
            gap: 3,
            background: "#050408",
            borderRadius: 12,
            padding: 6,
            opacity: phase === "playing" ? 1 : 0.35,
            pointerEvents: phase === "playing" ? "auto" : "none",
          }}
        >
          {board.map((rowArr, r) =>
            rowArr.map((cell, c) => {
              const key = `${r}-${c}`;
              const highlight = highlightMap.get(key);
              let bg = cell ?? "rgba(255,255,255,0.04)";
              if (highlight === true) bg = "rgba(74,222,128,0.65)";
              if (highlight === false) bg = "rgba(239,68,68,0.65)";
              return (
                <div
                  key={key}
                  style={{
                    borderRadius: 4,
                    background: bg,
                    transition: "background 0.08s ease",
                  }}
                />
              );
            })
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 18, gap: 10 }}>
          {tray.map((piece, i) => {
            if (!piece) {
              return <div key={i} style={{ width: 80, height: 80 }} />;
            }
            const maxR = Math.max(...piece.shape.map(([r]) => r)) + 1;
            const maxC = Math.max(...piece.shape.map(([, c]) => c)) + 1;
            const cellPx = 15;
            const isDragging = draggingIndex === i;
            return (
              <div
                key={piece.id}
                onPointerDown={(e) => {
                  if (phase !== "playing") return;
                  e.preventDefault();
                  setDraggingIndex(i);
                  setHoverAnchor(null);
                }}
                style={{
                  width: 80,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: phase === "playing" ? "grab" : "default",
                  opacity: isDragging ? 0.25 : 1,
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${maxC}, ${cellPx}px)`,
                    gridTemplateRows: `repeat(${maxR}, ${cellPx}px)`,
                    gap: 2,
                  }}
                >
                  {Array.from({ length: maxR * maxC }, (_, idx) => {
                    const r = Math.floor(idx / maxC);
                    const c = idx % maxC;
                    const filled = piece.shape.some(([sr, sc]) => sr === r && sc === c);
                    return (
                      <div
                        key={idx}
                        style={{
                          width: cellPx,
                          height: cellPx,
                          borderRadius: 3,
                          background: filled ? piece.color : "transparent",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
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
              background: "rgba(10,10,12,0.7)",
              backdropFilter: "blur(2px)",
              textAlign: "center",
              padding: 20,
              borderRadius: 18,
            }}
          >
            {phase === "idle" && (
              <>
                <p style={{ margin: 0, color: "#F2E4C2", fontSize: 15, maxWidth: 380 }}>
                  {connected
                    ? "Start when you're ready — your score is saved automatically."
                    : "Connect your wallet to play."}
                </p>
                <button
                  onClick={() => startGame()}
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

            {phase === "over" && (
              <>
                <p style={{ margin: 0, color: "#F2E4C2", fontSize: 22, fontWeight: 800 }}>
                  Board full — Score: {score}
                </p>
                {busy && <p style={{ color: "rgba(242,228,194,0.6)", fontSize: 13, margin: 0 }}>Verifying score...</p>}
                {!busy && result?.status === "verified" && (
                  <p style={{ color: "#4ADE80", fontSize: 14, margin: 0 }}>✅ Verified and added to the leaderboard.</p>
                )}
                {!busy && result?.status === "flagged" && (
                  <p style={{ color: "#FACC15", fontSize: 14, margin: 0 }}>
                    ⚠️ Flagged for review ({result.reason}). Awaiting admin approval.
                  </p>
                )}
                {!busy && result?.status === "rejected" && (
                  <p style={{ color: "#EF4444", fontSize: 14, margin: 0 }}>
                    ❌ Rejected ({result.reason}). Not saved.
                  </p>
                )}
                {!busy && errorMsg && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{errorMsg}</p>}
                <button
                  onClick={() => startGame()}
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
                  Play Again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <GameLeaderboard gameId="block_blast" refreshKey={refreshKey} />
    </div>
  );
}