"use client";

import { useState, useEffect } from "react";
import { Music2, Minimize2 } from "lucide-react";
import { hasUserEntered } from "./WelcomeModal";

// Track solicitado: embed 4AL4EamHEBKPpdcFRkYdXN
const SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/track/4AL4EamHEBKPpdcFRkYdXN?utm_source=generator&theme=0";

export default function SpotifyPlayer() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (hasUserEntered()) {
      setShouldLoad(true);
      return;
    }
    const onEnter = () => setShouldLoad(true);
    window.addEventListener("welcomeEnter", onEnter);
    return () => window.removeEventListener("welcomeEnter", onEnter);
  }, []);

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9998] transition-all duration-300 ${
        isExpanded ? "w-[min(380px,95vw)]" : "w-20 h-20"
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center text-white shadow-lg hover:bg-[#1ed760] transition-colors border-2 border-white/20"
        aria-label={isExpanded ? "Minimizar reproductor" : "Expandir reproductor"}
      >
        {isExpanded ? (
          <Minimize2 className="w-5 h-5" />
        ) : (
          <Music2 className="w-8 h-8 animate-pulse" />
        )}
      </button>

      <div
        className={`overflow-hidden rounded-2xl bg-black/90 backdrop-blur-xl border-2 border-[#1DB954]/50 shadow-2xl transition-all duration-300 ${
          isExpanded ? "opacity-100 h-[152px]" : "opacity-0 h-0 pointer-events-none overflow-hidden"
        }`}
      >
        {shouldLoad && (
          <iframe
            data-testid="embed-iframe"
            style={{ borderRadius: "12px" }}
            src={SPOTIFY_EMBED_URL}
            width="100%"
            height="152"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify - Canción de la despedida JPCC"
          />
        )}
      </div>

      {!isExpanded && (
        <div className="absolute bottom-0 right-0 w-20 h-20 rounded-2xl bg-black/90 backdrop-blur-xl border-2 border-[#1DB954]/50 flex items-center justify-center shadow-xl">
          <Music2 className="w-8 h-8 text-[#1DB954]" />
        </div>
      )}
    </div>
  );
}
