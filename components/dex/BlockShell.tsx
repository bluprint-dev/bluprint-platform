"use client";

import { ReactNode } from "react";
import { Reorder, useDragControls, motion, AnimatePresence } from "framer-motion";
import { BlockId, BLOCK_META, useDexLayoutStore } from "@/store/dexLayoutStore";

// --- PALETTE ----------------------------------------------------------------
// Tek kaynaktan yonetilen 3 renk: sampanya sarisi / uzay siyahi / parlak gri-beyaz
const CHAMPAGNE = "#D4AF7A";
const CHAMPAGNE_RGB = "212,175,122";
const BRIGHT = "#EDEBE6";
const BRIGHT_RGB = "237,235,230";

// --- ICONS -------------------------------------------------------------------

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

function ExpandIcon({ expanded }: { expanded: boolean }) {
  if (expanded) {
    // Compress icon (kucult)
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <polyline points="9 3 9 9 3 9" />
        <polyline points="15 3 15 9 21 9" />
        <polyline points="9 21 9 15 3 15" />
        <polyline points="15 21 15 15 21 15" />
      </svg>
    );
  }
  // Expand icon (genislet)
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <polyline points="3 9 3 3 9 3" />
      <polyline points="21 9 21 3 15 3" />
      <polyline points="3 15 3 21 9 21" />
      <polyline points="21 15 21 21 15 21" />
    </svg>
  );
}

// --- HEADER BUTTON -------------------------------------------------------------

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
        border: `1px solid rgba(${CHAMPAGNE_RGB},0.2)`,
        background: `rgba(${CHAMPAGNE_RGB},0.06)`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        color: `rgba(${CHAMPAGNE_RGB},0.65)`,
        cursor: "pointer",
        transition: "all 0.18s cubic-bezier(0.16,1,0.3,1)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const b = e.currentTarget;
        b.style.borderColor = `rgba(${CHAMPAGNE_RGB},0.5)`;
        b.style.color = CHAMPAGNE;
        b.style.background = `rgba(${CHAMPAGNE_RGB},0.14)`;
        b.style.transform = "scale(1.08)";
      }}
      onMouseLeave={(e) => {
        const b = e.currentTarget;
        b.style.borderColor = `rgba(${CHAMPAGNE_RGB},0.2)`;
        b.style.color = `rgba(${CHAMPAGNE_RGB},0.65)`;
        b.style.background = `rgba(${CHAMPAGNE_RGB},0.06)`;
        b.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}

// --- BLOCK SHELL ---------------------------------------------------------------
// Her blok bu bilesenle sarmalanir. Reorder.Item + drag handle ile surukleme,
// header'daki chevron ile kucultme (collapse), buyutme butonu ile expand,
// X ile kapatma (close) saglar.

export default function BlockShell({
  id,
  headerRight,
  children,
  draggable = true,
}: {
  id: BlockId;
  headerRight?: ReactNode;
  children: ReactNode;
  draggable?: boolean;
}) {
  const dragControls = useDragControls();
  const { collapsed, expanded, toggleCollapsed, closeBlock, expandBlock } = useDexLayoutStore();
  const meta = BLOCK_META[id];
  const isCollapsed = collapsed[id];
  const isExpanded = expanded === id;
  const someoneElseExpanded = expanded !== null && !isExpanded;

  const cardStyle: React.CSSProperties = {
    flex: isExpanded ? "3 1 0" : someoneElseExpanded ? "0.6 1 0" : "1 1 0",
    minWidth: isExpanded ? 420 : 340,
    maxWidth: isExpanded ? 900 : 560,
    display: someoneElseExpanded ? "none" : "flex",
    flexDirection: "column",
    listStyle: "none",
    transition: "flex 0.3s ease, max-width 0.3s ease",
  };

  const inner = (
    <div
      className={`glass${isExpanded ? " glass-expanded" : ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderBottom: isCollapsed ? "none" : `1px solid rgba(${CHAMPAGNE_RGB},0.12)`,
          flexShrink: 0,
        }}
      >
        {draggable && (
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{
              cursor: "grab",
              color: `rgba(${CHAMPAGNE_RGB},0.4)`,
              display: "flex",
              alignItems: "center",
              touchAction: "none",
            }}
            title="Surukle"
          >
            <DragHandleIcon />
          </div>
        )}

        <span style={{ color: CHAMPAGNE, fontSize: 13 }}>{meta.icon}</span>

        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: `rgba(${BRIGHT_RGB},0.8)`,
            flex: 1,
          }}
        >
          {meta.title}
        </span>

        {!isCollapsed && headerRight}

        <HeaderBtn onClick={() => expandBlock(id)} title={isExpanded ? "Kucult" : "Genislet"}>
          <ExpandIcon expanded={isExpanded} />
        </HeaderBtn>
        <HeaderBtn onClick={() => toggleCollapsed(id)} title={isCollapsed ? "Genislet" : "Kucult"}>
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
  );

  // Mobilde (draggable=false) Reorder.Group context'i olmadigi icin
  // Reorder.Item kullanilamaz - duz bir div ile sarmalariz.
  if (!draggable) {
    return <div style={cardStyle}>{inner}</div>;
  }

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      style={cardStyle}
      layout
    >
      {inner}
    </Reorder.Item>
  );
}

// --- CLOSED BLOCK CHIP -----------------------------------------------------------
// Kapatilmis bloklar icin ustteki seritte gosterilen "yeniden ac" cipi.

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
        border: `1px dashed rgba(${CHAMPAGNE_RGB},0.32)`,
        background: `rgba(${CHAMPAGNE_RGB},0.06)`,
        color: `rgba(${CHAMPAGNE_RGB},0.65)`,
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        const b = e.currentTarget;
        b.style.borderColor = `rgba(${CHAMPAGNE_RGB},0.6)`;
        b.style.color = CHAMPAGNE;
        b.style.background = `rgba(${CHAMPAGNE_RGB},0.12)`;
      }}
      onMouseLeave={(e) => {
        const b = e.currentTarget;
        b.style.borderColor = `rgba(${CHAMPAGNE_RGB},0.32)`;
        b.style.color = `rgba(${CHAMPAGNE_RGB},0.65)`;
        b.style.background = `rgba(${CHAMPAGNE_RGB},0.06)`;
      }}
    >
      <span>{meta.icon}</span>
      {meta.title}
      <span style={{ opacity: 0.6 }}>+</span>
    </button>
  );
}