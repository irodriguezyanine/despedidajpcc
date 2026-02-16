"use client";

import { motion } from "framer-motion";
import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { viewportSmooth } from "@/lib/motion";

// Según itinerario: Viernes 20 y Sábado 21 Feb 2026
const VIERNES = [
  { time: "10:00 - 17:00", activity: "Libre" },
  { time: "17:00 - 19:00", activity: "Futgolf y piscina" },
  { time: "19:00 - 20:00", activity: "Sunset DJ Juanjo" },
  { time: "20:00 - 21:00", activity: "Asado by Rucio" },
  { time: "21:00 - 22:00", activity: "Dinámica Sorpresa 1" },
  { time: "22:00 - 23:00", activity: "Asado by Rucio" },
  { time: "23:00 - 00:00", activity: "Hito Sorpresa 1" },
  { time: "00:00 - 02:00", activity: "Traslado disco" },
  { time: "02:00 - 03:00", activity: "Disco" },
  { time: "03:00 - 04:00", activity: "Traslado casa" },
];

const SABADO = [
  { time: "10:00 - 11:00", activity: "Casa" },
  { time: "11:00 - 12:00", activity: "Dinámica Sorpresa 2" },
  { time: "12:00 - 13:00", activity: "Traslado playa" },
  { time: "13:00 - 14:00", activity: "Almuerzo" },
  { time: "14:00 - 17:00", activity: "Playa" },
  { time: "17:00 - 19:00", activity: "Sunset" },
  { time: "19:00 - 20:00", activity: "Hito Sorpresa 2" },
  { time: "20:00 - 21:00", activity: "Traslado casa" },
  { time: "21:00 - 22:00", activity: "Comida" },
  { time: "22:00 - 23:00", activity: "—" },
  { time: "23:00 - 00:00", activity: "Pre" },
  { time: "00:00 - 02:00", activity: "Traslado disco" },
  { time: "02:00 - 03:00", activity: "Disco" },
  { time: "03:00 - 04:00", activity: "Traslado casa" },
];

function DayBlock({
  day,
  date,
  items,
  delay = 0,
}: {
  day: string;
  date: string;
  items: { time: string; activity: string }[];
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportSmooth}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className="glass-card rounded-2xl p-5 sm:p-6 border border-white/20 hover:border-amber-400/30 hover:shadow-[0_0_30px_rgba(251,191,36,0.08)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-amber-400" />
        <h3 className="font-display text-xl sm:text-2xl text-white">{day}</h3>
      </div>
      <p className="text-sm text-white/60 font-body mb-4">{date}</p>
      <ul className="space-y-2">
        {items.map((row, i) => (
          <li
            key={i}
            className={cn(
              "flex flex-wrap items-baseline gap-2 sm:gap-4 py-2 border-b border-white/5 last:border-0",
              row.activity === "—" && "opacity-50"
            )}
          >
            <span className="font-mono text-xs sm:text-sm text-amber-200/80 shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {row.time}
            </span>
            <span className="font-body text-sm text-white/90">
              {row.activity}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Itinerary() {
  return (
    <section id="itinerario" className="relative py-24 px-4 overflow-hidden stripes-football">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/itinerario-playa.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/90 via-red-950/40 to-sky-950/92" />
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-red-500/5" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSmooth}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="font-display text-3xl sm:text-4xl md:text-5xl text-center mb-4 text-white"
        >
          ITINERARIO <span className="text-amber-400">VIERNES Y SÁBADO</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportSmooth}
          transition={{ duration: 0.3 }}
          className="text-center text-white/60 font-body text-sm mb-12"
        >
          20-22 Febrero 2026 · Lomas de Mantagua
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8">
          <DayBlock
            day="Viernes"
            date="20 Febrero"
            items={VIERNES}
            delay={0}
          />
          <DayBlock
            day="Sábado"
            date="21 Febrero"
            items={SABADO}
            delay={0.1}
          />
        </div>
      </div>
    </section>
  );
}
