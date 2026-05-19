"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SupportWidget() {
  const [isOnline, setIsOnline] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const TELEGRAM_BOT_LINK = "https://t.me/bluprint_support_bot";

  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    window.open(TELEGRAM_BOT_LINK, "_blank");
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-6 right-6 z-50 group relative"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-300">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"
        >
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-green-500 rounded-full"
          />
        </motion.div>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-gray-700"
            >
              💬 Contact Support
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 border-r border-t border-gray-700" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {!isOnline && (
        <div className="fixed bottom-24 right-6 z-40 bg-red-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
          ⚠️ Support offline
        </div>
      )}
    </>
  );
}