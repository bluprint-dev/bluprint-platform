"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    embeddedChatbotConfig: {
      chatbotId: string;
      domain: string;
    };
  }
}

export default function ChatbaseEmbed() {
  useEffect(() => {
    // Chatbase config
    window.embeddedChatbotConfig = {
      chatbotId: "g-snFwRE_q01msUtqIo3W",
      domain: "www.chatbase.co"
    };

    // Chatbase widget script
    const script = document.createElement("script");
    script.src = "https://www.chatbase.co/embed.min.js";
    script.id = "g-snFwRE_q01msUtqIo3W";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      const oldScript = document.querySelector('script[id="g-snFwRE_q01msUtqIo3W"]');
      if (oldScript) oldScript.remove();
    };
  }, []);

  return null;
}