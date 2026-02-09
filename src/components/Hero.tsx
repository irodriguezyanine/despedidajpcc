"use client";

import { motion } from "framer-motion";
import Countdown from "./Countdown";
import { cn } from "@/lib/utils";
import { MapPin, Calendar } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Fondo playa/verano: gradiente mar y cielo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(12,74,110,0.4) 0%, rgba(13,148,136,0.3) 30%, rgba(15,118,110,0.5) 60%, rgba(10,6,18,0.95) 100%),
            radial-gradient(ellipse 80% 50% at 50% 20%, rgba(254,243,199,0.15) 0%, transparent 50%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-900/20 to-violet-950/80" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-mono text-sm sm:text-base tracking-[0.4em] text-miami-blue text-neon-cyan uppercase mb-4"
        >
          CUENTA REGRESIVA
        </motion.p>

        <Countdown />

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-10 sm:mt-14 text-white leading-tight"
        >
          DESPEDIDA DE SOLTEROS
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset-orange via-amber-300 to-miami-blue">
            JPCC
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-4 text-white/90 font-body text-base sm:text-lg flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        >
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-400" />
            20 — 22 Febrero 2026
          </span>
          <span className="text-white/60">·</span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-400" />
            Lomas de Mantagua, Viña del Mar
          </span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-2 text-amber-200/80 font-body text-sm"
        >
          ALAMICOS R.F.C · Reggaeton Fútbol Club
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mt-10 sm:mt-12"
        >
          <a
            href="#itinerario"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-4 rounded-lg font-body font-semibold",
              "bg-white/10 backdrop-blur border border-teal-400/50 text-white",
              "hover:border-teal-400 hover:shadow-neon-cyan hover:bg-white/15",
              "transition-all duration-300 hover:animate-glitch"
            )}
          >
            VER ITINERARIO
          </a>
          <a
            href="#mapa"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-4 rounded-lg font-body font-semibold",
              "bg-white/10 backdrop-blur border border-amber-400/50 text-white",
              "hover:border-amber-400 hover:shadow-neon-orange hover:bg-white/15",
              "transition-all duration-300"
            )}
          >
            <MapPin className="w-5 h-5" />
            VER UBICACIÓN
          </a>
        </motion.div>
      </div>
    </section>
  );
}
