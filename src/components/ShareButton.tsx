"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

const TITLE = "Despedida de solteros JPCC | ALAMICOS · Quintero 2026";
const TEXT = "20-22 Febrero · Calle La Isla, parcela 6c. Quintero (Al frente de Sunshine). ¡Nos vemos!";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: TITLE,
          text: TEXT,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-6 py-4 rounded-lg font-body font-semibold bg-white/10 backdrop-blur border border-white/30 text-white hover:bg-white/15 hover:border-white/40 transition-all duration-300"
    >
      <Share2 className="w-5 h-5" />
      {copied ? "¡Enlace copiado!" : "Compartir"}
    </button>
  );
}
