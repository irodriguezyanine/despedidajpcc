"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_CUPS = 6;
const CUP_ROWS = [3, 2, 1]; // triángulo clásico

export default function BeerPong() {
  const [ballPos, setBallPos] = useState({ x: 50, y: 92 });
  const [score, setScore] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [cupsHit, setCupsHit] = useState<number[]>([]);
  const [lastThrow, setLastThrow] = useState<"hit" | "miss" | null>(null);

  const remainingCups = TOTAL_CUPS - cupsHit.length;

  const throwBall = () => {
    if (isFlying || remainingCups <= 0) return;
    setIsFlying(true);
    setLastThrow(null);

    setBallPos({ x: 45 + Math.random() * 10, y: 15 });

    setTimeout(() => {
      const hit = Math.random() > 0.5;
      if (hit && cupsHit.length < TOTAL_CUPS) {
        const newCup = cupsHit.length;
        setCupsHit((prev) => [...prev, newCup]);
        setScore((s) => s + 1);
        setLastThrow("hit");
      } else {
        setLastThrow("miss");
      }
      setBallPos({ x: 50, y: 92 });
      setIsFlying(false);
    }, 900);
  };

  const resetGame = () => {
    setCupsHit([]);
    setScore(0);
    setBallPos({ x: 50, y: 92 });
    setLastThrow(null);
  };

  const cupId = (row: number, i: number) =>
    CUP_ROWS.slice(0, row).reduce((a, b) => a + b, 0) + i;

  return (
    <section id="beerpong" className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-green/95 via-red-950/30 to-violet-950/95" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,0.2) 30px, rgba(255,255,255,0.2) 32px)`,
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-2 text-white"
        >
          ALAMICOS <span className="text-red-400">BEER PONG</span> 🍻
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/60 font-body text-sm mb-8"
        >
          Lanza la pelota · Primera ronda en la casa
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-red-500/30 shadow-[0_0_40px_rgba(220,38,38,0.15)]"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="font-mono text-white/90">
              Puntaje: <span className="text-amber-400 font-bold">{score}</span>
            </div>
            <div className="font-mono text-white/70 text-sm">
              Vasos: {remainingCups}/{TOTAL_CUPS}
            </div>
          </div>

          <div
            className="relative mx-auto rounded-xl overflow-hidden border-2 border-white/20 bg-black/40"
            style={{ width: "280px", height: "360px" }}
          >
            {/* Mesa / zona de vasos (triángulo 3-2-1) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              style={{ top: "12%" }}
            >
              {CUP_ROWS.map((n, row) => (
                <div
                  key={row}
                  className="flex gap-3"
                  style={{ marginLeft: `${row * 14}px` }}
                >
                  {Array.from({ length: n }).map((_, i) => {
                    const id = cupId(row, i);
                    const hit = cupsHit.includes(id);
                    return (
                      <motion.div
                        key={`${row}-${i}`}
                        initial={{ scale: 1, opacity: 1 }}
                        animate={
                          hit
                            ? { scale: 0, opacity: 0, y: 20 }
                            : { scale: 1, opacity: 1 }
                        }
                        transition={{ duration: 0.3 }}
                        className="w-10 h-10 rounded-full border-2 border-red-500/80 bg-red-900/60 flex items-center justify-center shrink-0"
                        style={{
                          boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.4)",
                        }}
                      >
                        {!hit && (
                          <span className="text-[10px] text-white/60 font-mono">
                            🍺
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Pelota */}
            <motion.div
              className="absolute w-5 h-5 rounded-full bg-white border-2 border-amber-400/50"
              style={{
                left: `calc(${ballPos.x}% - 10px)`,
                bottom: `${ballPos.y}%`,
                boxShadow: "0 0 12px rgba(255,255,255,0.6), 0 0 24px rgba(251,191,36,0.3)",
              }}
              animate={{
                y: isFlying ? [0, -8, 0] : 0,
                scale: isFlying ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />

            {/* Línea de lanzamiento */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-white/30"
              style={{ bottom: "18%" }}
            />
          </div>

          <AnimatePresence mode="wait">
            {lastThrow === "hit" && (
              <motion.p
                key="hit"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-amber-400 font-display text-lg mt-3"
              >
                ¡Punto!
              </motion.p>
            )}
            {lastThrow === "miss" && (
              <motion.p
                key="miss"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-white/50 font-body text-sm mt-3"
              >
                Casi…
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <motion.button
              onClick={throwBall}
              disabled={isFlying || remainingCups <= 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl font-display text-lg tracking-wide text-white bg-red-500 border-2 border-red-400/50 shadow-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              LANZAR PELOTA
            </motion.button>
            <motion.button
              onClick={resetGame}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-4 rounded-xl font-body text-sm text-white/90 border border-white/30 hover:bg-white/10 transition-colors"
            >
              Reiniciar
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
