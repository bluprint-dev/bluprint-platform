"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const GAMES = [
  {
    id: "axor-runner",
    name: "Axor Runner",
    desc: "Dodge rug pullers, thieves, and evil eyes. The longer you survive, the higher your score.",
    available: true,
    emoji: "🦖",
  },
  {
    id: "flappy-bird",
    name: "Flappy Bird",
    desc: "Coming soon.",
    available: false,
    emoji: "🐦",
  },
  {
    id: "block-blast",
    name: "Block Blast",
    desc: "Coming soon.",
    available: false,
    emoji: "🧩",
  },
];

export default function GameDefiPage() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <h1
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: 36,
            fontWeight: 900,
            color: "#F2E4C2",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Game<span style={{ color: "#D4AF7A" }}>DeFi</span>
        </h1>
        <p style={{ color: "rgba(242,228,194,0.55)", marginTop: 10, fontSize: 14 }}>
          Play, score, and claim your share of the daily reward pool.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {GAMES.map((g, i) => {
          const card = (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={g.available ? { y: -4 } : {}}
              style={{
                position: "relative",
                borderRadius: 20,
                padding: 28,
                background:
                  "linear-gradient(160deg, rgba(212,175,122,0.09), rgba(20,18,24,0.4))",
                border: "1px solid rgba(212,175,122,0.18)",
                cursor: g.available ? "pointer" : "default",
                opacity: g.available ? 1 : 0.5,
                minHeight: 190,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              <div>
                <div style={{ fontSize: 42, marginBottom: 14 }}>{g.emoji}</div>
                <h3
                  style={{
                    margin: 0,
                    color: "#F2E4C2",
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: "var(--font-outfit), sans-serif",
                  }}
                >
                  {g.name}
                </h3>
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: "rgba(242,228,194,0.5)",
                    lineHeight: 1.5,
                  }}
                >
                  {g.desc}
                </p>
              </div>
              {!g.available && (
                <span
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 16,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: "#D4AF7A",
                    background: "rgba(212,175,122,0.1)",
                    border: "1px solid rgba(212,175,122,0.25)",
                    borderRadius: 6,
                    padding: "4px 8px",
                  }}
                >
                  SOON
                </span>
              )}
            </motion.div>
          );

          return g.available ? (
            <Link key={g.id} href={`/gamedefi/${g.id}`} style={{ textDecoration: "none" }}>
              {card}
            </Link>
          ) : (
            <div key={g.id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}