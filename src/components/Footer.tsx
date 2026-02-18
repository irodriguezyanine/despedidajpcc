"use client";

import { motion } from "framer-motion";
import { Music, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative py-20 px-4 border-t border-white/10 overflow-hidden stripes-football">
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-green/98 via-red-950/20 to-sky-950/98" />
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 glass-card rounded-2xl p-8 mb-12 border-teal-500/30"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-8 h-8 text-[#1DB954]" />
            <span className="font-display text-xl text-white">
              MUSIC & VIBE
            </span>
          </div>
          <iframe
            data-testid="embed-iframe"
            style={{ borderRadius: 12 }}
            src="https://open.spotify.com/embed/playlist/09mqrtfDEDU0SWMfbsQVbr?utm_source=generator"
            width="100%"
            height="152"
            frameBorder={0}
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Playlist Spotify"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative z-10 font-mono text-sm text-white/50 flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4 text-red-400" />
          Calle La Isla, parcela 6c. Quintero (Al frente de Sunshine)
        </motion.p>
        <p className="relative z-10 mt-2 text-white/30 text-xs font-body">
          DESPEDIDA DE SOLTEROS JPCC · ALAMICOS R.F.C · 20-22 Febrero 2026
        </p>
      </div>
    </footer>
  );
}
