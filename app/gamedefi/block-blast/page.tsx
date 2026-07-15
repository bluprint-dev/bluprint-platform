"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface Popup {
  id: number;
  text: string;
  sub?: string;
}

const BOARD_SIZE = 8;
const DRAG_LIFT = 64;

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

const COMBO_LABELS: Record<number, string> = {
  1: "",
  2: "DOUBLE!",
  3: "TRIPLE!",
  4: "MEGA!",
};

function comboLabel(cleared: number): string {
  return COMBO_LABELS[cleared] ?? "INSANE!";
}

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

function clearLines(board: Board): { board: Board; cleared: number; rows: number[]; cols: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every((cell) => cell != null)) rows.push(r);
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board.every((row) => row[c] != null)) cols.push(c);
  }

  if (rows.length === 0 && cols.length === 0) {
    return { board, cleared: 0, rows, cols };
  }

  const next = board.map((r) => [...r]);
  for (const r of rows) {
    for (let c = 0; c < BOARD_SIZE; c++) next[r][c] = null;
  }
  for (const c of cols) {
    for (let r = 0; r < BOARD_SIZE; r++) next[r][c] = null;
  }

  return { board: next, cleared: rows.length + cols.length, rows, cols };
}

export default function BlockBlastPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const boardElRef = useRef<HTMLDivElement>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupIdRef = useRef(0);
  const prevBoardRef = useRef<Board>(emptyBoard());

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
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());
  const [justPlaced, setJustPlaced] = useState<Set<string>>(new Set());
  const [popups, setPopups] = useState<Popup[]>([]);
  const [shake, setShake] = useState(false);

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

  // pop-in animation for newly filled cells
  useEffect(() => {
    const prev = prevBoardRef.current;
    const changed = new Set<string>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (prev[r][c] == null && board[r][c] != null) changed.add(`${r}-${c}`);
      }
    }
    prevBoardRef.current = board;
    if (changed.size === 0) return;
    setJustPlaced(changed);
    const t = setTimeout(() => setJustPlaced(new Set()), 260);
    return () => clearTimeout(t);
  }, [board]);

  const pushPopup = useCallback((text: string, sub?: string) => {
    const id = ++popupIdRef.current;
    setPopups((p) => [...p, { id, text, sub }]);
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 900);
  }, []);

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

  useEffect(() => {
    if (phase !== "playing") return;
    const hasAnyPiece = tray.some((p) => p != null);
    if (!hasAnyPiece) return;
    const anyPlaceable = tray.some((p) => p != null && canPlaceAnywhere(board, p.shape));
    if (!anyPlaceable) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setTimeout(() => endGame(), 350);
    }
  }, [board, tray, phase, endGame]);

  const commitPlacement = useCallback((index: number, piece: Piece, row: number, col: number) => {
    const placedBoard = placePiece(boardLiveRef.current, piece.shape, row, col, piece.color);
    setBoard(placedBoard);
    setTray((prev) => {
      const next = [...prev];
      next[index] = null;
      if (next.every((p) => p == null)) {
        return [randomPiece(), randomPiece(), randomPiece()];
      }
      return next;
    });

    const { board: clearedBoard, cleared, rows, cols } = clearLines(placedBoard);

    if (cleared > 0) {
      const flash = new Set<string>();
      for (const r of rows) for (let c = 0; c < BOARD_SIZE; c++) flash.add(`${r}-${c}`);
      for (const c of cols) for (let r = 0; r < BOARD_SIZE; r++) flash.add(`${r}-${c}`);
      setFlashCells(flash);

      window.setTimeout(() => {
        setBoard(clearedBoard);
        setFlashCells(new Set());
        const gain = piece.shape.length + 10 * cleared * cleared;
        setScore((s) => {
          const ns = s + gain;
          scoreRef.current = ns;
          return ns;
        });
        pushPopup(`+${gain}`, comboLabel(cleared));
      }, 190);
    } else {
      const gain = piece.shape.length;
      setScore((s) => {
        const ns = s + gain;
        scoreRef.current = ns;
        return ns;
      });
    }
  }, [pushPopup]);

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
      prevBoardRef.current = emptyBoard();
      setBoard(emptyBoard());
      setTray([randomPiece(), randomPiece(), randomPiece()]);
      setScore(0);
      scoreRef.current = 0;
      setResult(null);
      setErrorMsg(null);
      setPopups([]);
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
      const valid = canPlace(board, piece.shape, hoverAnchor.row, hoverAnchor.col);
      for (const [dr, dc] of piece.shape) {
        const r = hoverAnchor.row + dr;
        const c = hoverAnchor.col + dc;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          highlightMap.set(`${r}-${c}`, valid);
        }
      }
    }
  }

  return (
    <div style={{ maxWidth: "min(620px, 96vw)", margin: "0 auto", padding: "28px 12px 80px" }}>
      <style>{`
        @keyframes bbLineFlash {
          0%   { filter: brightness(1); }
          50%  { filter: brightness(2.1); }
          100% { filter: brightness(1.4); }
        }
        @keyframes bbShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .bb-cell-pop {
          animation: bbCellPop 0.24s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes bbCellPop {
          0%   { transform: scale(0.35); opacity: 0.3; }
          60%  { transform: scale(1.14); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .bb-shake { animation: bbShake 0.4s ease; }
        @media (max-width: 380px) {
          .bb-tray-piece { width: 66px !important; height: 66px !important; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: "clamp(20px, 5vw, 26px)",
              fontWeight: 900,
              color: "#F2E4C2",
              margin: 0,
            }}
          >
            🧩 Block Blast
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(242,228,194,0.5)" }}>
            Drag pieces onto the board. Clear full rows or columns to score.
          </p>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12.5,
            color: "#D4AF7A",
            background: "rgba(212,175,122,0.08)",
            border: "1px solid rgba(212,175,122,0.2)",
            borderRadius: 10,
            padding: "7px 12px",
          }}
        >
          {connected && publicKey ? shortenAddress(publicKey.toBase58()) : "Wallet not connected"}
        </div>
      </div>

      <RewardPoolBanner gameId="block_blast" />

      <motion.div
        className={shake ? "bb-shake" : ""}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: "relative",
          borderRadius: 20,
          padding: "14px clamp(10px, 3vw, 18px)",
          border: "1px solid rgba(212,175,122,0.22)",
          boxShadow: "0 14px 44px rgba(0,0,0,0.45)",
          background: "linear-gradient(160deg, #14111a, #0a090d)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            fontFamily: "var(--font-mono), monospace",
            fontSize: "clamp(18px, 5vw, 22px)",
            fontWeight: 800,
            color: "#F2E4C2",
            marginBottom: 10,
            position: "relative",
            height: 28,
          }}
        >
          {String(score).padStart(5, "0")}

          <div style={{ position: "absolute", right: 0, top: "50%" }}>
            <AnimatePresence>
              {popups.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: 1, y: -46, scale: 1 }}
                  exit={{ opacity: 0, y: -70 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    right: 0,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#4ADE80" }}>{p.text}</div>
                  {p.sub && (
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#FACC15", letterSpacing: "0.04em" }}>
                      {p.sub}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
            gap: "clamp(2px, 0.8vw, 4px)",
            background: "#050408",
            borderRadius: 14,
            padding: "clamp(4px, 1.5vw, 8px)",
            boxShadow: "inset 0 0 24px rgba(0,0,0,0.6)",
            opacity: phase === "playing" ? 1 : 0.35,
            pointerEvents: phase === "playing" ? "auto" : "none",
            touchAction: "none",
          }}
        >
          {board.map((rowArr, r) =>
            rowArr.map((cell, c) => {
              const key = `${r}-${c}`;
              const highlight = highlightMap.get(key);
              const flashing = flashCells.has(key);
              const popped = justPlaced.has(key);

              let bg = "rgba(255,255,255,0.04)";
              let boxShadow = "none";
              if (cell) {
                bg = cell;
                boxShadow = "inset 0 -3px 0 rgba(0,0,0,0.28), inset 0 2px 0 rgba(255,255,255,0.3)";
              }
              if (highlight === true) {
                bg = "rgba(74,222,128,0.7)";
                boxShadow = "inset 0 0 0 2px rgba(74,222,128,0.9)";
              }
              if (highlight === false) {
                bg = "rgba(239,68,68,0.7)";
                boxShadow = "inset 0 0 0 2px rgba(239,68,68,0.9)";
              }

              return (
                <div
                  key={key}
                  className={popped ? "bb-cell-pop" : ""}
                  style={{
                    borderRadius: 5,
                    background: bg,
                    boxShadow,
                    animation: flashing ? "bbLineFlash 0.19s ease-in-out infinite" : undefined,
                    transition: "background-color 0.12s ease, box-shadow 0.12s ease",
                  }}
                />
              );
            })
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16, gap: 8 }}>
          <AnimatePresence mode="popLayout">
            {tray.map((piece, i) => {
              if (!piece) {
                return <div key={`empty-${i}`} style={{ width: 80, height: 80 }} />;
              }
              const maxR = Math.max(...piece.shape.map(([r]) => r)) + 1;
              const maxC = Math.max(...piece.shape.map(([, c]) => c)) + 1;
              const cellPx = 15;
              const isDragging = draggingIndex === i;
              return (
                <motion.div
                  key={piece.id}
                  className="bb-tray-piece"
                  initial={{ opacity: 0, scale: 0.4, y: 10 }}
                  animate={{
                    opacity: isDragging ? 0.2 : 1,
                    scale: isDragging ? 0.9 : 1,
                    y: 0,
                  }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  whileTap={{ scale: 0.94 }}
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
                    touchAction: "none",
                    userSelect: "none",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
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
                            boxShadow: filled
                              ? "inset 0 -2px 0 rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.3)"
                              : "none",
                          }}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {phase !== "playing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                background: "rgba(10,10,12,0.72)",
                backdropFilter: "blur(3px)",
                textAlign: "center",
                padding: 20,
                borderRadius: 20,
              }}
            >
              {phase === "idle" && (
                <>
                  <p style={{ margin: 0, color: "#F2E4C2", fontSize: 15, maxWidth: 380 }}>
                    {connected
                      ? "Start when you're ready — your score is saved automatically."
                      : "Connect your wallet to play."}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
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
                  </motion.button>
                  {errorMsg && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{errorMsg}</p>}
                </>
              )}

              {phase === "over" && (
                <>
                  <motion.p
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 16 }}
                    style={{ margin: 0, color: "#F2E4C2", fontSize: 22, fontWeight: 800 }}
                  >
                    Board full — Score: {score}
                  </motion.p>
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
                  <motion.button
                    whileTap={{ scale: 0.95 }}
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
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <GameLeaderboard gameId="block_blast" refreshKey={refreshKey} />
    </div>
  );
}