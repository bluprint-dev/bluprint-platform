"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div style={{ position: "relative" }}>
      {/* Glow behind focused input */}
      <div style={{
        position: "absolute", inset: -1,
        borderRadius: 13,
        background: "linear-gradient(90deg, rgba(153,69,255,0.3), rgba(20,241,149,0.15))",
        opacity: value ? 1 : 0,
        transition: "opacity 0.3s",
        pointerEvents: "none",
        zIndex: 0,
        filter: "blur(8px)",
      }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center" }}>
        {/* Terminal prompt */}
        <span style={{
          position: "absolute", left: 14,
          color: "rgba(153,69,255,0.5)",
          fontFamily: "monospace", fontSize: 14, fontWeight: 700,
          userSelect: "none", pointerEvents: "none",
        }}>›_</span>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="search token, symbol, mint..."
          style={{
            width: "100%", height: 48,
            paddingLeft: 40, paddingRight: value ? 40 : 16,
            background: "#07070f",
            border: `1px solid ${value ? "rgba(153,69,255,0.35)" : "rgba(153,69,255,0.12)"}`,
            borderRadius: 12,
            color: "#fff",
            fontSize: 13,
            fontFamily: "monospace",
            outline: "none",
            transition: "border-color 0.2s",
            letterSpacing: "0.02em",
            boxSizing: "border-box",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(153,69,255,0.5)"; }}
          onBlur={e => { e.target.style.borderColor = value ? "rgba(153,69,255,0.35)" : "rgba(153,69,255,0.12)"; }}
        />

        {value && (
          <button
            onClick={() => onChange("")}
            aria-label="Clear search"
            style={{
              position: "absolute", right: 12,
              background: "rgba(153,69,255,0.1)",
              border: "1px solid rgba(153,69,255,0.2)",
              borderRadius: 6,
              color: "rgba(153,69,255,0.7)",
              width: 24, height: 24,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 12,
              transition: "all 0.15s",
            }}
          >✕</button>
        )}
      </div>
    </div>
  );
}