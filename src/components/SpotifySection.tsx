"use client";

import { motion } from "framer-motion";
import { Music, ExternalLink } from "lucide-react";

const ARTISTS = [
  { name: "Arcángel", url: "https://open.spotify.com/intl-es/artist/4SsVbpTthjScTS7U2hmr1X?si=o7ErsLy4TQWhlxuawFwVSg" },
  { name: "Zion & Lennox", url: "https://open.spotify.com/intl-es/artist/21451j1KhjAiaYKflxBjr1?si=EVIUoXqDQvGqvjl5sLC_Dw" },
  { name: "Ozuna", url: "https://open.spotify.com/intl-es/artist/1i8SpTcr7yvPOmcqrbnVXY?si=I5bgaTKiR4K8JPtkFVAO6w" },
  { name: "Daddy Yankee", url: "https://open.spotify.com/intl-es/artist/4VMYDCV2IEDYJArk749S6m?si=ZISgxZZrRnKw_VLGADhMjA" },
  { name: "Feid", url: "https://open.spotify.com/intl-es/artist/2LRoIwlKmHjgvigdNGBHNo?si=sbZu724qSE-hIh_nHy9Ddw" },
  { name: "Ke Personajes", url: "https://open.spotify.com/intl-es/artist/06Q5VlSAku57lFzyME3HrM?si=s2DGuSgIROymH7Kz-cGAZw" },
  { name: "Moral Distraída", url: "https://open.spotify.com/intl-es/artist/4IdI1p8OrVpot6dbdCl3wv?si=P2xpOcAARV6CXjabjkfJ6Q" },
  { name: "La Champions Liga", url: "https://open.spotify.com/intl-es/artist/4osqF39bEPXPsJfVUXeCh3?si=-4XCQbRAT7SaVkSjEM2h6g" },
];

export default function SpotifySection() {
  return (
    <section id="musica" className="relative py-24 px-4 overflow-hidden stripes-football">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/95 via-red-950/25 to-sky-950/95" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <Music className="w-8 h-8 text-[#1DB954]" />
          <h2 className="font-display text-2xl sm:text-3xl text-white">
            ARTISTAS QUE NOS GUSTAN
          </h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/60 font-body text-sm mb-8"
        >
          ALAMICOS REGGAETON FÚTBOL CLUB
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin"
          style={{
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory",
          }}
        >
          <div className="flex gap-4 justify-start min-w-max" style={{ scrollSnapType: "x mandatory" }}>
            {ARTISTS.map((artist) => (
              <a
                key={artist.url}
                href={artist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-[180px] sm:w-[200px] rounded-xl bg-white/10 border-2 border-[#1DB954]/30 hover:border-[#1DB954]/70 hover:bg-white/15 transition-all duration-300 p-4 flex flex-col items-center justify-center text-center gap-2 group"
                style={{ scrollSnapAlign: "start" }}
              >
                <span className="font-display text-lg sm:text-xl text-white group-hover:text-[#1DB954] transition-colors line-clamp-2">
                  {artist.name}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#1DB954] text-sm font-body">
                  <span className="w-6 h-6 rounded-full bg-[#1DB954]/20 flex items-center justify-center">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                  Ver en Spotify
                </span>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
