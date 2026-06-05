"use client";

import { useEffect, useRef } from "react";

const MARQUEE_MESSAGES = [
  "Create your own meme coin",
  "0% platform fees",
  "Bonding curve launch",
  "Fair launch",
  "Instant liquidity",
];

export default function MarqueeBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const speed = 1;
    const maxScroll = scrollContainer.scrollWidth / 2;

    const animate = () => {
      if (!scrollContainer) return;
      scrollAmount += speed;
      if (scrollAmount >= maxScroll) {
        scrollAmount = 0;
      }
      scrollContainer.scrollLeft = scrollAmount;
      requestAnimationFrame(animate);
    };

    const animation = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animation);
  }, []);

  const allMessages = [...MARQUEE_MESSAGES, ...MARQUEE_MESSAGES];

  return (
    <div
      className="relative overflow-hidden bg-[#0A0A0F] border-y border-[#14F195]/20 py-3"
      style={{ backgroundColor: "#0A0A0F" }}
    >
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-none gap-8 whitespace-nowrap"
        style={{ scrollBehavior: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <div className="flex items-center gap-8 pl-24">
          {allMessages.map((message, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-[#14F195] text-sm font-medium"
            >
              <span style={{ color: "#9945FF" }}>◆</span>
              <span>{message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}