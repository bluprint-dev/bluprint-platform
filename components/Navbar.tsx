"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

// ─── LINE-STYLE ICONS (cizgi ikon, duz renk emoji degil) ───────────────────

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function IconCreate({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconGameDefi({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="7.5" width="19" height="10" rx="4" />
      <path d="M7 10.3v3.4M5.3 12h3.4" />
      <circle cx="16" cy="10.7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18.3" cy="13" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconArena({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l7 7M20 4l-7 7M4 4l1.5 5M20 4l-1.5 5" />
      <path d="M9.5 13 6 20M14.5 13 18 20" />
      <path d="M6.5 20h3M15 20h3" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/create", label: "Create", Icon: IconCreate },
  { href: "/gamedefi", label: "GameDeFi", Icon: IconGameDefi },
  { href: "/arena", label: "Arena", Icon: IconArena },
] as const;

export default function Navbar({ topOffset = 0 }: { topOffset?: number }) {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "sticky",
        top: topOffset,
        marginTop: topOffset,
        zIndex: 90,
        display: "flex",
        justifyContent: "center",
        padding: "10px 20px",
      }}
    >
      <style>{`
        .axor-nav-link { position: relative; }
        .axor-nav-link:hover:not(.axor-nav-link-active) { color: #D4AF7A !important; }
        .axor-nav-link:hover:not(.axor-nav-link-active) svg { transform: translateY(-1px); }
        .axor-nav-link svg { transition: transform 0.2s ease; }
        @media (max-width: 560px) {
          .axor-nav-label { display: none; }
          .axor-nav-link { padding: 10px 12px !important; }
        }
      `}</style>

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 5,
          borderRadius: 999,
          background: "rgba(14,13,16,0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(212,175,122,0.16)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
        }}
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`axor-nav-link${active ? " axor-nav-link-active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 999,
                textDecoration: "none",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: active ? "#0A0A0C" : "rgba(237,235,230,0.55)",
                transition: "color 0.25s ease",
                zIndex: 1,
              }}
            >
              {active && (
                <motion.span
                  layoutId="axor-nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: "linear-gradient(135deg,#D4AF7A,#E8C989)",
                    zIndex: -1,
                  }}
                />
              )}
              <Icon active={active} />
              <span className="axor-nav-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}