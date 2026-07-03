"use client";

import { ReactNode } from "react";
import { Reorder, useDragControls, motion, AnimatePresence } from "framer-motion";
import { BlockId, BLOCK_META, useDexLayoutStore } from "@/store/dexLayoutStore";

// ─── DRAG HANDLE ICON ────────────────────────────────────────────────────────

function DragHandleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="6" r="1.6" />
      <circle cx="16" cy="6" r="1.6" />
      <circle cx="8" cy="12" r="1.6" />
      <circle cx="16" cy="12" r="1.6" />
      <circle cx="8" cy="18" r="1.6" />
      <circle cx="16" cy="18" r="1.6" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── HEADER BUTTON ────────────────────────────────────────────────────────────

function HeaderBtn({ onClick, title, children }: { onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 7,
        border: "1px solid rgba(153,69,255,0.16)",
        background: "rgba(153,69,255,0.05)",
        color: "rgba(153,69,255,0.55)",
        cursor: "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const b = e.currentTarget;
        b.style.borderColor = "rgba(153,69,255,0.4)";
        b.style.color = "#9945FF";
        b.style.background = "rgba(153,69,255,0.12)";
      }}
      onMouseLeave={(e) => {
        const b = e.currentTarget;
        b.style.borderColor = "rgba(153,69,255,0.16)";
        b.style.color = "rgba(153,69,255,0.55)";
        b.style.background = "rgba(153,69,255,0.05)";
      }}
    >
      {children}
    </button>
  );
}

// ─── BLOCK SHELL ──────────────────────────────────────────────────────────────
// Her blok bu bileşenle sarmalanır. Reorder.Item + drag handle ile sürükleme,
// header'daki chevron ile küçültme (collapse), X ile kapatma (close) sağlar.

export default function BlockShell({
  id,
  headerRight,
  children,
}: {
  id: BlockId;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const dragControls = useDragControls();
  const { collapsed, toggleCollapsed, closeBlock } = useDexLayoutStore();
  const meta = BLOCK_META[id];
  const isCollapsed = collapsed[id];

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      style={{
        flex: "1 1 0",
        minWidth: 340,
        maxWidth: 560,
        display: "flex",
        flexDirection: "column",
        listStyle: "none",
      }}
      layout
    >
      <div
        className="glass"
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "100%",
          background: "rgba(255,255,255,0.025)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderBottom: isCollapsed ? "none" : "1px solid rgba(153,69,255,0.1)",
            flexShrink: 0,
          }}
        >
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{
              cursor: "grab",
              color: "rgba(153,69,255,0.35)",
              display: "flex",
              alignItems: "center",
              touchAction: "none",
            }}
            title="Sürükle"
          >
            <DragHandleIcon />
          </div>

          <span style={{ color: "#9945FF", fontSize: 13 }}>{meta.icon}</span>

          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.75)",
              flex: 1,
            }}
          >
            {meta.title}
          </span>

          {!isCollapsed && headerRight}

          <HeaderBtn onClick={() => toggleCollapsed(id)} title={isCollapsed ? "Genişlet" : "Küçült"}>
            <ChevronIcon open={!isCollapsed} />
          </HeaderBtn>
          <HeaderBtn onClick={() => closeBlock(id)} title="Kapat">
            <CloseIcon />
          </HeaderBtn>
        </div>

        {/* Body */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
}

// ─── CLOSED BLOCK CHIP ────────────────────────────────────────────────────────
// Kapatılmış bloklar için üstteki şeritte gösterilen "yeniden aç" çipi.

export function ClosedBlockChip({ id }: { id: BlockId }) {
  const openBlock = useDexLayoutStore((s) => s.openBlock);
  const meta = BLOCK_META[id];
  return (
    <button
      onClick={() => openBlock(id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 14px",
        borderRadius: 10,
        border: "1px dashed rgba(153,69,255,0.28)",
        background: "rgba(153,69,255,0.05)",
        color: "rgba(153,69,255,0.55)",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        const b = e.currentTarget;
        b.style.borderColor = "rgba(153,69,255,0.55)";
        b.style.color = "#9945FF";
        b.style.background = "rgba(153,69,255,0.1)";
      }}
      onMouseLeave={(e) => {
        const b = e.currentTarget;
        b.style.borderColor = "rgba(153,69,255,0.28)";
        b.style.color = "rgba(153,69,255,0.55)";
        b.style.background = "rgba(153,69,255,0.05)";
      }}
    >
      <span>{meta.icon}</span>
      {meta.title}
      <span style={{ opacity: 0.6 }}>＋</span>
    </button>
  );
}