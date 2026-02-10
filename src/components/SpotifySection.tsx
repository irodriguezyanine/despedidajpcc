"use client";

import { motion } from "framer-motion";
import { Music } from "lucide-react";

// Canción de la despedida - mismo embed que pediste
const SPOTIFY_EMBED_SRC =
  "https://open.spotify.com/embed/track/4AL4EamHEBKPpdcFRkYdXN?utm_source=generator&theme=0";

export default function SpotifySection() {
  return (
    <section id="musica" className="relative py-24 px-4 overflow-hidden stripes-football">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/95 via-red-950/25 to-sky-950/95" />
      <div className="relative z-10 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <Music className="w-8 h-8 text-[#1DB954]" />
          <h2 className="font-display text-2xl sm:text-3xl text-white">
            LA CANCIÓN DE LA DESPEDIDA
          </h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/60 font-body text-sm mb-8"
        >
          Dale play · También en el reproductor abajo a la derecha
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden border-2 border-[#1DB954]/30 shadow-2xl bg-black/40 p-2"
        >
          <iframe
            data-testid="embed-iframe"
            style={{ borderRadius: "12px" }}
            src={SPOTIFY_EMBED_SRC}
            width="100%"
            height="152"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify - Canción de la despedida JPCC"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-[800px] mx-auto rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/40"
        >
          <iframe
            src="https://html5.gamedistribution.com/527ae66f4e664fdc8847e7ce952165dc/?gd_sdk_referrer_url=https://www.example.com/games/beerpong"
            width="800"
            height="600"
            className="w-full h-[min(600px,75vw)] max-h-[600px]"
            style={{ border: 0 }}
            scrolling="no"
            title="Juego"
          />
        </motion.div>
      </div>
    </section>
  );
}
