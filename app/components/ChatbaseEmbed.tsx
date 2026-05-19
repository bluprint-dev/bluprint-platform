"use client";

import { useEffect } from "react";

export default function ChatbaseEmbed() {
  useEffect(() => {
    const script = document.createElement("script");
    script.innerHTML = `
      (function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="g-snFwRE_q01msUtqIo3W";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();
    `;
    document.body.appendChild(script);

    return () => {
      const oldScript = document.querySelector('script[id="g-snFwRE_q01msUtqIo3W"]');
      if (oldScript) oldScript.remove();
    };
  }, []);

  return null;
}