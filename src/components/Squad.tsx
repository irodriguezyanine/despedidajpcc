"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { viewportSmooth } from "@/lib/motion";
import { Shirt } from "lucide-react";

const SQUAD = [
  { name: "Jose Antonio Saenz", apodo: "Jose", numero: 15 },
  { name: "Ignacio Rodríguez", apodo: "Rodri", numero: 9 },
  { name: "Maximiliano Gomez", apodo: "Maxi", numero: 5 },
  { name: "Benjamín Fernandez", apodo: "Feño", numero: 20 },
  { name: "Felipe Barrios", apodo: "Fiera", numero: 17 },
  { name: "Fernando Biskupovic", apodo: "Rucio", numero: 6 },
  { name: "Ignacio Cuevas", apodo: "Nachito", numero: 10 },
  { name: "Juan José Aguero", apodo: "Juanjo", numero: 2 },
  { name: "Rodrigo Funes", apodo: "Rorro", numero: 14 },
  { name: "Guillermo Pizarro", apodo: "Guille", numero: 18 },
  { name: "Ignacio Elguera", apodo: "Nacho", numero: 7 },
  { name: "Juan Pablo Rojas", apodo: "Juampi", numero: 1 },
  { name: "Juan Pablo Casas Cordero", apodo: "JPCC", numero: 11, groom: true },
  { name: "Nicolas Ruiseñor", apodo: "Nico", numero: 31 },
  { name: "Guillermo Prussing", apodo: "Memo", numero: 24 },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Squad() {
  return (
    <section id="crew" className="relative py-24 px-4 overflow-hidden stripes-football">
      {/* Fondo: imagen del equipo (caricatura ALAMICOS), como el pasto detrás de la cuenta regresiva */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/equipo-alamicos.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-green/90 via-stadium-green/85 to-sky-950/92" />
      <div className="absolute inset-0 bg-gradient-to-r from-real-red/5 via-transparent to-cyan-500/5" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSmooth}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="font-display text-3xl sm:text-4xl md:text-5xl text-center mb-2 text-white"
        >
          ALAMICOS <span className="text-red-400">R.F.C</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportSmooth}
          className="text-center text-white/60 font-body text-sm mb-10"
        >
          LA NOMINA
        </motion.p>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={viewportSmooth}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
        >
          {SQUAD.map((person) => (
            <motion.div
              key={person.name}
              variants={item}
              className={cn(
                "glass-card rounded-xl p-3 sm:p-4 transition-all duration-300",
                "hover:border-red-400/40 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:shadow-lg",
                "cursor-default",
                person.groom && "ring-2 ring-amber-400/60 border-amber-400/40 shadow-[0_0_24px_rgba(251,191,36,0.2)]"
              )}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 font-mono font-bold text-sm",
                    person.groom
                      ? "bg-amber-500/30 border border-amber-400/50 text-amber-300"
                      : "bg-white/10 border border-white/20 text-white/80"
                  )}
                >
                  <span>{person.numero}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-body font-semibold text-white text-sm truncate">
                    {person.name}
                  </p>
                  <p className="text-xs text-red-200/80 font-mono flex items-center gap-1">
                    <Shirt className="w-3 h-3 shrink-0" />
                    {person.apodo} — #{person.numero}
                  </p>
                  {person.groom && (
                    <p className="text-[10px] text-amber-400/90 font-mono uppercase tracking-wider mt-0.5">
                      El novio
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
