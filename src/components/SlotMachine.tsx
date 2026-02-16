"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REELS = 6;
const ROWS = 7; // Más de 6 filas
const SPIN_DURATION_MS = 2800;

const SYMBOLS = [
  { id: "fiesta", label: "🎉 Fiesta", emoji: "🎉" },
  { id: "shot", label: "🍾 Shot", emoji: "🍾" },
  { id: "piquito", label: "😘 Piquito", emoji: "😘" },
  { id: "alseco", label: "🥃 Al seco", emoji: "🥃" },
  { id: "regala2", label: "🎁 Regala 2", emoji: "🎁" },
  { id: "regala4", label: "🎀 Regala 4", emoji: "🎀" },
  { id: "llamaex", label: "📞 Llama a tu ex", emoji: "📞" },
  { id: "tapita", label: "🍺 Tapita", emoji: "🍺" },
  { id: "regalaalseco", label: "🥴 Regala al seco", emoji: "🥴" },
];

function getRandomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function generateReel(length: number) {
  return Array.from({ length }, () => getRandomSymbol());
}

export default function SlotMachine() {
  const [reels, setReels] = useState(() =>
    Array.from({ length: REELS }, () => generateReel(ROWS * 3))
  );
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof SYMBOLS[0] | null>(null);
  const [showResult, setShowResult] = useState(false);

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setShowResult(false);
    setResult(null);

    const newReels = Array.from({ length: REELS }, () => generateReel(ROWS * 3));
    setReels(newReels);

    const timeout = setTimeout(() => {
      setSpinning(false);
      const centerRow = Math.floor(ROWS / 2);
      const centerSymbols = newReels.map((r) => r[centerRow + ROWS]);
      const counts: Record<string, number> = {};
      centerSymbols.forEach((s) => {
        counts[s.id] = (counts[s.id] ?? 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const winner = sorted[0] ? SYMBOLS.find((s) => s.id === sorted[0][0]) ?? centerSymbols[0] : centerSymbols[0];
      setResult(winner);
      setShowResult(true);
    }, SPIN_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [spinning]);

  return (
    <section
      id="slot-machine"
      className="relative py-24 px-4 overflow-hidden stripes-football"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/95 via-fuchsia-950/40 to-pitch-green/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-pink-500/5" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-2 text-white"
        >
          🎰 SLOT <span className="text-pink-400">ALAMICOS</span> 🎰
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/60 font-body text-sm mb-8"
        >
          Sin registro · Gira y cumple el reto
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-fuchsia-500/30 shadow-[0_0_40px_rgba(192,132,252,0.15)]"
        >
          {/* Máquina tragaperras */}
          <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border-4 border-amber-600/80 p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.5),0_0_20px_rgba(251,191,36,0.2)]">
            {/* Marco superior estilo casino */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-gradient-to-b from-amber-500 to-amber-700 rounded-b-lg shadow-lg" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-1 bg-amber-500 rounded-full text-slate-900 font-display text-sm font-bold">
              ALAMICOS
            </div>

            {/* Ventana de símbolos - 7 filas visibles */}
            <div className="relative overflow-hidden rounded-lg bg-black/60 border-2 border-amber-500/50 p-2 mt-6">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${REELS}, 1fr)` }}>
                {reels.map((reel, colIdx) => (
                  <div
                    key={colIdx}
                    className="relative h-[280px] overflow-hidden"
                  >
                    <motion.div
                      className="flex flex-col items-center gap-0.5"
                      animate={
                        spinning
                          ? {
                              y: [0, -56 * ROWS],
                              transition: {
                                duration: SPIN_DURATION_MS / 1000,
                                ease: [0.25, 0.1, 0.25, 1],
                                delay: colIdx * 0.12,
                              },
                            }
                          : { y: 0 }
                      }
                    >
                      {reel.map((sym, rowIdx) => (
                        <div
                          key={`${colIdx}-${rowIdx}`}
                          className="w-full h-14 flex-shrink-0 flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-xl font-bold"
                        >
                          <span className="drop-shadow-md">{sym.emoji}</span>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>

            {/* Línea ganadora (centro) */}
            <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[calc(100%/7)] border-2 border-amber-400/80 rounded pointer-events-none bg-amber-400/10 -z-0" style={{ top: "50%" }} />

            {/* Botón GIRAR */}
            <motion.button
              type="button"
              onClick={spin}
              disabled={spinning}
              whileHover={!spinning ? { scale: 1.05 } : undefined}
              whileTap={!spinning ? { scale: 0.98 } : undefined}
              className="w-full mt-6 py-4 rounded-xl font-display text-xl text-white bg-gradient-to-b from-amber-500 to-amber-700 border-2 border-amber-400/50 shadow-[0_4px_20px_rgba(251,191,36,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {spinning ? "GIRANDO..." : "🎰 GIRAR"}
            </motion.button>
          </div>

          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-4 rounded-xl bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border-2 border-pink-400/50 text-center"
              >
                <p className="text-white/70 font-body text-sm mb-1">¡Tu reto!</p>
                <p className="font-display text-2xl text-pink-300">
                  {result.emoji} {result.label}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-white/40 text-xs font-body mt-4">
            Símbolos: Fiesta · Shot · Piquito · Al seco · Regala 2 · Regala 4 · Llama a tu ex · Tapita · Regala al seco
          </p>
        </motion.div>
      </div>
    </section>
  );
}
