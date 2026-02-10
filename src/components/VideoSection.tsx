"use client";

import { motion } from "framer-motion";

const YOUTUBE_EMBED = "https://www.youtube.com/embed/1idbbsdqM6Y?autoplay=0";

export default function VideoSection() {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Fondo: rayas sutiles fútbol + gradiente fiesta */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/95 via-red-950/20 to-violet-950/90" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.15) 40px,
            rgba(255,255,255,0.15) 42px
          )`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-[1fr,1fr] gap-10 lg:gap-14 items-center"
        >
          {/* Video a la izquierda */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden border-2 border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.2)] ring-2 ring-white/10">
              <div className="aspect-video bg-black/60">
                <iframe
                  src={YOUTUBE_EMBED}
                  title="Real hasta la muerte"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-500/10 to-amber-500/10 blur-xl -z-10" />
          </div>

          {/* Mensaje REAL HASTA LA MUERTE: mitad rojo, mitad blanco */}
          <div className="order-1 lg:order-2 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
            >
              <span
                className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-red-600 to-red-500 animate-pulse-neon"
                style={{ textShadow: "0 0 30px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.2)" }}
              >
                REAL HASTA
              </span>
              <br />
              <span
                className="inline-block text-white"
                style={{ textShadow: "0 0 20px rgba(255,255,255,0.4), 0 0 40px rgba(255,255,255,0.15)" }}
              >
                LA MUERTE
              </span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-red-500 to-white"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
