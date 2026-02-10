"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_CUPS = 6;
const CUP_ROWS = [3, 2, 1];

// Posiciones de cada vaso en % del área de juego (x, y) — triángulo clásico
const CUP_CENTERS: { x: number; y: number }[] = [
  { x: 25, y: 18 },
  { x: 50, y: 18 },
  { x: 75, y: 18 },
  { x: 37.5, y: 28 },
  { x: 62.5, y: 28 },
  { x: 50, y: 38 },
];

const HIT_RADIUS = 14; // % — radio para considerar que la pelota "entró" en un vaso
const BALL_START = { x: 50, y: 88 };

export interface Participant {
  id: string;
  name: string;
  score: number;
}

function generateId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function BeerPong() {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [cupsHit, setCupsHit] = useState<number[]>([]);
  const [ballPos, setBallPos] = useState(BALL_START);
  const [aimPoint, setAimPoint] = useState<{ x: number; y: number } | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const [lastThrow, setLastThrow] = useState<"hit" | "miss" | null>(null);

  const remainingCups = TOTAL_CUPS - cupsHit.length;

  const addParticipant = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    const id = generateId();
    setParticipants((prev) => [...prev, { id, name, score: 0 }]);
    if (!currentPlayerId) setCurrentPlayerId(id);
    setNewName("");
  }, [newName, currentPlayerId]);

  const handleGameAreaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isFlying || remainingCups <= 0 || !gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      // Solo apuntar en la zona de vasos (mitad superior)
      if (y < 55) {
        setAimPoint({ x, y });
      }
    },
    [isFlying, remainingCups]
  );

  const throwBall = useCallback(() => {
    if (isFlying || remainingCups <= 0 || !currentPlayerId) return;
    const target = aimPoint || { x: 50, y: 25 };
    setAimPoint(null);
    setIsFlying(true);
    setLastThrow(null);

    // Pequeño factor aleatorio para que no sea perfecto
    const endX = target.x + (Math.random() - 0.5) * 12;
    const endY = target.y + (Math.random() - 0.5) * 10;

    setBallPos({ x: endX, y: endY });

    setTimeout(() => {
      let hitCup: number | null = null;
      let minDist = Infinity;
      for (let i = 0; i < TOTAL_CUPS; i++) {
        if (cupsHit.includes(i)) continue;
        const c = CUP_CENTERS[i];
        const dist = Math.hypot(endX - c.x, endY - c.y);
        if (dist < HIT_RADIUS && dist < minDist) {
          minDist = dist;
          hitCup = i;
        }
      }

      if (hitCup !== null) {
        setCupsHit((prev) => [...prev, hitCup!].sort((a, b) => a - b));
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === currentPlayerId ? { ...p, score: p.score + 1 } : p
          )
        );
        setLastThrow("hit");
      } else {
        setLastThrow("miss");
      }

      setBallPos(BALL_START);
      setIsFlying(false);
    }, 700);
  }, [
    isFlying,
    remainingCups,
    currentPlayerId,
    aimPoint,
    cupsHit,
  ]);

  const resetCups = useCallback(() => {
    setCupsHit([]);
    setLastThrow(null);
    setBallPos(BALL_START);
    setAimPoint(null);
  }, []);

  const cupId = (row: number, i: number) =>
    CUP_ROWS.slice(0, row).reduce((a, b) => a + b, 0) + i;

  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

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
          className="text-center text-white/60 font-body text-sm mb-6"
        >
          Apunta con un clic · Lanza el botón · Suma puntos
        </motion.p>

        {/* Nombre y unirse */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-2 mb-4"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addParticipant()}
            placeholder="Tu nombre"
            className="flex-1 min-w-[120px] px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:border-red-400/50"
          />
          <button
            type="button"
            onClick={addParticipant}
            className="px-5 py-2.5 rounded-xl font-body text-sm font-medium bg-red-500/80 text-white border border-red-400/50 hover:bg-red-500 transition-colors"
          >
            Unirse
          </button>
        </motion.div>

        {/* Tabla de participantes */}
        {participants.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-4 mb-6 border border-white/20"
          >
            <p className="font-display text-sm text-white/80 mb-3 uppercase tracking-wider">
              Participantes
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="text-white/60 border-b border-white/10">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 text-right">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`border-b border-white/5 last:border-0 ${
                        p.id === currentPlayerId ? "bg-red-500/15" : ""
                      }`}
                    >
                      <td className="py-2 pr-3 text-white/70">{idx + 1}</td>
                      <td className="py-2 pr-3 text-white font-medium">
                        {p.name}
                        {p.id === currentPlayerId && (
                          <span className="ml-2 text-xs text-amber-400">
                            (lanza)
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right text-amber-400 font-mono font-bold">
                        {p.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {participants.length > 1 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <label className="text-xs text-white/50 block mb-1">
                  Quién lanza ahora
                </label>
                <select
                  value={currentPlayerId ?? ""}
                  onChange={(e) => setCurrentPlayerId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-body text-sm focus:outline-none focus:border-red-400/50"
                >
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-red-500/30 shadow-[0_0_40px_rgba(220,38,38,0.15)]"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="font-mono text-white/70 text-sm">
              Vasos: {remainingCups}/{TOTAL_CUPS}
            </div>
            {currentPlayerId && (
              <div className="font-body text-sm text-white/80">
                Lanzando:{" "}
                <span className="text-amber-400 font-medium">
                  {participants.find((p) => p.id === currentPlayerId)?.name}
                </span>
              </div>
            )}
          </div>

          <div
            ref={gameAreaRef}
            role="button"
            tabIndex={0}
            onClick={handleGameAreaClick}
            className="relative mx-auto rounded-xl overflow-hidden border-2 border-white/20 bg-black/40 cursor-crosshair select-none touch-none"
            style={{ width: "280px", height: "360px" }}
          >
            {/* Vasos */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
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

            {/* Línea de puntería (viewBox 0 0 100 100 = %) */}
            {aimPoint && !isFlying && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1={50}
                  y1={88}
                  x2={aimPoint.x}
                  y2={aimPoint.y}
                  stroke="rgba(251,191,36,0.8)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={aimPoint.x}
                  cy={aimPoint.y}
                  r="3"
                  fill="rgba(251,191,36,0.4)"
                  stroke="rgba(251,191,36,0.9)"
                  strokeWidth="0.8"
                />
              </svg>
            )}

            {/* Pelota */}
            <motion.div
              className="absolute w-5 h-5 rounded-full bg-white border-2 border-amber-400/50 pointer-events-none"
              style={{
                left: `calc(${ballPos.x}% - 10px)`,
                top: `${ballPos.y}%`,
                boxShadow:
                  "0 0 12px rgba(255,255,255,0.6), 0 0 24px rgba(251,191,36,0.3)",
              }}
              transition={{
                duration: isFlying ? 0.7 : 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />

            <div
              className="absolute left-0 right-0 h-0.5 bg-white/30 pointer-events-none"
              style={{ bottom: "16%" }}
            />
          </div>

          <p className="text-center text-white/50 text-xs font-body mt-2">
            Clic en la zona de vasos para apuntar
          </p>

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
              disabled={
                isFlying ||
                remainingCups <= 0 ||
                !currentPlayerId
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl font-display text-lg tracking-wide text-white bg-red-500 border-2 border-red-400/50 shadow-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              LANZAR PELOTA
            </motion.button>
            <motion.button
              onClick={resetCups}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-4 rounded-xl font-body text-sm text-white/90 border border-white/30 hover:bg-white/10 transition-colors"
            >
              Reiniciar vasos
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
