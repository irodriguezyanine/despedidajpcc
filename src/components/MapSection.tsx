"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

// Lomas de Mantagua, Viña del Mar (cerca de Maitencillo) - Google Maps embed por búsqueda
const MAP_EMBED_URL =
  "https://www.google.com/maps?q=Lomas+de+Mantagua,+Vi%C3%B1a+del+Mar,+Chile&output=embed";

export default function MapSection() {
  return (
    <section id="mapa" className="relative py-24 px-4 overflow-hidden stripes-football">
      <div className="absolute inset-0 bg-gradient-to-b from-stadium-green/90 via-sky-950/90 to-pitch-green/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-amber-500/5" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl sm:text-4xl md:text-5xl text-center mb-4 text-white"
        >
          UBICACIÓN <span className="text-cyan-400">LOMAS DE MANTAGUA</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/70 font-body text-sm mb-8 flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4 text-cyan-400" />
          Viña del Mar · Cerca de Maitencillo
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl aspect-video w-full max-w-4xl mx-auto"
        >
          <iframe
            src={MAP_EMBED_URL}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa Lomas de Mantagua, Viña del Mar"
            className="w-full h-full min-h-[300px]"
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/50 text-xs mt-4 font-body"
        >
          Playa chilena · Verano 2026
        </motion.p>
      </div>
    </section>
  );
}
