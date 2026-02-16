"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const API_LEADERBOARD = "/api/penales/leaderboard";

const TOTAL_PENALTIES = 5;

interface Goleador {
  id: string;
  name: string;
  goals: number;
  updatedAt?: string;
}

function generateClientId(): string {
  return `penales_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

const PhaserGame = dynamic(() => import("@/game/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-[#0d2818]" style={{ width: 360, height: 500 }}>
      <p className="text-white/60 font-body text-sm">Cargando juego...</p>
    </div>
  ),
});

export default function Penales() {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [goleadores, setGoleadores] = useState<Goleador[]>([]);
  const [tableVisible, setTableVisible] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(API_LEADERBOARD);
      const json = await res.json();
      if (json.data) setGoleadores(json.data);
    } catch {
      setGoleadores([]);
    }
  }, []);

  const saveScore = useCallback(
    async (goals: number) => {
      if (!clientId || !name || goals <= 0) return;
      try {
        await fetch(API_LEADERBOARD, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, name, goals }),
        });
        await fetchLeaderboard();
      } catch {}
    },
    [clientId, name, fetchLeaderboard]
  );

  useEffect(() => {
    setMounted(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onStartClick = () => {
    const n = name.trim();
    if (!n) return;
    setShowInstruction(true);
  };

  const startGame = () => {
    setShowInstruction(false);
    setClientId(generateClientId());
    setScore(0);
    setAttempts(0);
    setStage(2);
  };

  const exitToStage1 = () => {
    if (score > 0 && clientId && name) saveScore(score);
    setStage(1);
  };

  const remainingPenalties = TOTAL_PENALTIES - attempts;
  const sortedGoleadores = [...goleadores].sort((a, b) => b.goals - a.goals);

  return (
    <section id="penales" className="relative py-24 px-4 overflow-hidden stripes-football">
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-green/98 via-stadium-green/90 to-pitch-green/98" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(13,40,24,0.9),transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,0.2) 24px, rgba(255,255,255,0.2) 26px)` }} />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-2 text-white">
          ⚽ PENALES <span className="text-amber-400">ALAMICOS</span> ⚽
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center text-white/70 font-body text-sm mb-8">
          Juego de penales con Phaser · 5 penales
        </motion.p>

        <AnimatePresence>
          {showInstruction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setShowInstruction(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card rounded-2xl p-6 max-w-sm border-2 border-amber-500/50 text-center"
              >
                <h3 className="font-display text-xl text-white mb-4">¿Cómo jugar?</h3>
                <p className="font-body text-white/90 text-sm mb-4">Toca el arco para apuntar y arrastra la pelota para patear.</p>
                <motion.button type="button" onClick={startGame} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-8 py-3 rounded-xl font-display text-lg text-white bg-amber-500 border border-amber-400/50 hover:bg-amber-600">
                  ¡Jugar!
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {stage === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 border-2 border-amber-500/30 text-center">
            <h3 className="font-display text-xl sm:text-2xl text-white mb-6">Iniciar partido</h3>
            <label className="block text-left text-white/80 font-body text-sm mb-2">Nombre del goleador:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onStartClick()} placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:border-amber-400/50 mb-6" />
            <motion.button type="button" onClick={onStartClick} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-8 py-4 rounded-xl font-display text-lg text-white bg-amber-500 border border-amber-400/50 hover:bg-amber-600">
              Jugar
            </motion.button>
            <button type="button" onClick={() => { setTableVisible((v) => !v); if (!tableVisible) requestAnimationFrame(() => document.getElementById("penales-tabla")?.scrollIntoView({ behavior: "smooth" })); }} className="mt-6 inline-block font-body text-sm text-amber-400 hover:text-amber-300 underline transition-colors">
              {tableVisible ? "Ocultar ranking" : "Ver ranking"}
            </button>
          </motion.div>
        )}

        {stage === 2 && mounted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-amber-500/40 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <span className="font-mono text-white/80 text-sm">Goles: <span className="text-amber-400 font-bold">{score}</span> / {attempts} · Penales: {remainingPenalties}</span>
              <span className="font-body text-sm text-white/80">{name}</span>
            </div>

            <div className="relative mx-auto rounded-xl border-2 border-white/20 overflow-hidden touch-none select-none" style={{ maxWidth: 360 }}>
              <PhaserGame className="w-full" />
            </div>

            <div className="flex gap-3 mt-6 justify-center">
              <motion.button type="button" onClick={exitToStage1} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl font-body text-sm text-white bg-white/20 border border-white/40 hover:bg-white/30">
                Terminar y guardar
              </motion.button>
              <button type="button" onClick={() => { setTableVisible((v) => !v); if (!tableVisible) document.getElementById("penales-tabla")?.scrollIntoView({ behavior: "smooth" }); }} className="font-body text-sm text-amber-400 hover:text-amber-300 underline">
                Ver ranking
              </button>
            </div>
          </motion.div>
        )}

        {mounted && tableVisible && (
          <motion.div id="penales-tabla" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mt-6 border border-white/20 scroll-mt-24">
            <p className="font-display text-sm text-white/80 mb-3 uppercase tracking-wider">Ranking de goleadores</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="text-white/60 border-b border-white/10">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 text-right">Goles</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGoleadores.map((g, idx) => (
                    <tr key={g.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-3 text-white/70">{idx + 1}</td>
                      <td className="py-2 pr-3 text-white font-medium">{g.name}</td>
                      <td className="py-2 text-right text-amber-400 font-mono font-bold">{g.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
