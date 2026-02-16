"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_LEADERBOARD = "/api/penales/leaderboard";

const GOAL_WIDTH = 320;
const GOAL_HEIGHT = 140;
const BALL_R = 12;
const KEEPER_WIDTH = 80;
const KEEPER_HEIGHT = 50;
const PENALTY_DIST = 180;

type GamePhase = "aim" | "kicking" | "scored" | "saved" | "ready";

interface Goleador {
  id: string;
  name: string;
  goals: number;
  updatedAt?: string;
}

function generateClientId(): string {
  return `penales_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export default function Penales() {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("aim");
  const [aimPos, setAimPos] = useState({ x: GOAL_WIDTH / 2, y: GOAL_HEIGHT / 2 });
  const [ballPos, setBallPos] = useState({ x: GOAL_WIDTH / 2, y: PENALTY_DIST + BALL_R });
  const [keeperDiving, setKeeperDiving] = useState<"left" | "center" | "right" | null>(null);
  const [goleadores, setGoleadores] = useState<Goleador[]>([]);
  const [tableVisible, setTableVisible] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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
      } catch {
        // fallback local
      }
    },
    [clientId, name, fetchLeaderboard]
  );

  useEffect(() => {
    setMounted(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const startGame = () => {
    const n = name.trim();
    if (!n) return;
    setClientId(generateClientId());
    setScore(0);
    setAttempts(0);
    setStage(2);
    setPhase("aim");
  };

  const pickKeeperDirection = useCallback((): "left" | "center" | "right" => {
    const r = Math.random();
    if (r < 0.35) return "left";
    if (r < 0.65) return "center";
    return "right";
  }, []);

  const kick = useCallback(() => {
    if (phase !== "aim") return;
    setPhase("kicking");

    const keeperDir = pickKeeperDirection();
    setKeeperDiving(keeperDir);

    const targetX = aimPos.x;
    const targetY = aimPos.y;

    const keeperZoneLeft = (GOAL_WIDTH / 3) * 0;
    const keeperZoneCenter = (GOAL_WIDTH / 3) * 1;
    const keeperZoneRight = (GOAL_WIDTH / 3) * 2;

    const keeperCovers = (x: number) => {
      if (keeperDir === "left") return x < keeperZoneCenter;
      if (keeperDir === "center") return x >= keeperZoneLeft && x < keeperZoneRight;
      return x >= keeperZoneCenter;
    };

    const isGoal = !keeperCovers(targetX);

    setAttempts((a) => a + 1);

    if (isGoal) {
      setScore((s) => s + 1);
      setPhase("scored");
    } else {
      setPhase("saved");
    }

    setBallPos({ x: targetX, y: targetY });

    setTimeout(() => {
      setPhase("ready");
      setKeeperDiving(null);
      setBallPos({ x: GOAL_WIDTH / 2, y: PENALTY_DIST + BALL_R });
      setAimPos({ x: GOAL_WIDTH / 2, y: GOAL_HEIGHT / 2 });
    }, 1800);
  }, [phase, aimPos, pickKeeperDirection]);

  const handleAimClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== "aim") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const goalTop = rect.height - GOAL_HEIGHT;
    if (relY < goalTop) return;
    const goalY = relY - goalTop;
    const x = ((e.clientX - rect.left) / rect.width) * GOAL_WIDTH;
    setAimPos({
      x: Math.max(BALL_R, Math.min(GOAL_WIDTH - BALL_R, x)),
      y: Math.max(BALL_R, Math.min(GOAL_HEIGHT - BALL_R, goalY)),
    });
  };

  const handleAimTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (phase !== "aim") return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const t = e.touches[0];
    const relY = t.clientY - rect.top;
    const goalTop = rect.height - GOAL_HEIGHT;
    if (relY < goalTop) return;
    const goalY = relY - goalTop;
    const x = ((t.clientX - rect.left) / rect.width) * GOAL_WIDTH;
    setAimPos({
      x: Math.max(BALL_R, Math.min(GOAL_WIDTH - BALL_R, x)),
      y: Math.max(BALL_R, Math.min(GOAL_HEIGHT - BALL_R, goalY)),
    });
  };

  const exitToStage1 = () => {
    if (score > 0 && clientId && name) saveScore(score);
    setStage(1);
    setPhase("aim");
  };

  const sortedGoleadores = [...goleadores].sort((a, b) => b.goals - a.goals);

  return (
    <section
      id="penales"
      className="relative py-24 px-4 overflow-hidden stripes-football"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-green/98 via-stadium-green/90 to-pitch-green/98" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(13,40,24,0.9),transparent_70%)]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,0.2) 24px, rgba(255,255,255,0.2) 26px)`,
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-2 text-white"
        >
          ⚽ PENALES <span className="text-amber-400">ALAMICOS</span> ⚽
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/70 font-body text-sm mb-8"
        >
          Tira penales contra el arquero · Ranking de goleadores
        </motion.p>

        {stage === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 border-2 border-amber-500/30 text-center"
          >
            <h3 className="font-display text-xl sm:text-2xl text-white mb-6">
              Iniciar partido
            </h3>
            <label className="block text-left text-white/80 font-body text-sm mb-2">
              Nombre del goleador:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startGame()}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:border-amber-400/50 mb-6"
            />
            <motion.button
              type="button"
              onClick={startGame}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl font-display text-lg text-white bg-amber-500 border border-amber-400/50 hover:bg-amber-600"
            >
              Jugar
            </motion.button>
            <button
              type="button"
              onClick={() => {
                setTableVisible((v) => !v);
                if (!tableVisible) {
                  requestAnimationFrame(() => {
                    document.getElementById("penales-tabla")?.scrollIntoView({ behavior: "smooth" });
                  });
                }
              }}
              className="mt-6 inline-block font-body text-sm text-amber-400 hover:text-amber-300 underline transition-colors"
            >
              {tableVisible ? "Ocultar ranking" : "Ver ranking"}
            </button>
          </motion.div>
        )}

        {stage === 2 && mounted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-amber-500/40 shadow-[0_0_40px_rgba(251,191,36,0.15)]"
          >
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <span className="font-mono text-white/80 text-sm">
                Goles: <span className="text-amber-400 font-bold">{score}</span> / {attempts}
              </span>
              <span className="font-body text-sm text-white/80">
                {name}
              </span>
            </div>

            {/* Cancha de penales */}
            <div
              ref={canvasRef}
              className="relative mx-auto rounded-xl overflow-hidden touch-none select-none border-2 border-white/20"
              style={{
                width: GOAL_WIDTH,
                height: PENALTY_DIST + GOAL_HEIGHT + 40,
                maxWidth: "100%",
              }}
            >
              {/* Césped */}
              <div
                className="absolute inset-0 cursor-crosshair"
                style={{
                  background: "linear-gradient(to bottom, #0d2818 0%, #134e1a 40%, #166534 100%)",
                }}
                onClick={handleAimClick}
                onTouchMove={handleAimTouch}
                onTouchStart={handleAimTouch}
              >
                {/* Líneas de la cancha */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/30" />
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-white/30 -bottom-8"
                  style={{ bottom: GOAL_HEIGHT - 20 }}
                />
              </div>

              {/* Arco */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 border-4 border-white rounded-t-lg"
                style={{
                  width: GOAL_WIDTH + 16,
                  height: GOAL_HEIGHT + 8,
                  marginBottom: -4,
                }}
              >
                <div
                  className="absolute inset-2 rounded-t border-2 border-white/60 bg-black/30"
                  style={{ top: 4 }}
                />
              </div>

              {/* Punto de mira (solo en aim) */}
              {phase === "aim" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/30 pointer-events-none"
                  style={{
                    left: aimPos.x,
                    bottom: GOAL_HEIGHT - aimPos.y,
                  }}
                />
              )}

              {/* Pelota */}
              <motion.div
                animate={{
                  left: ballPos.x - BALL_R,
                  bottom: phase === "kicking" || phase === "scored" || phase === "saved"
                    ? GOAL_HEIGHT - ballPos.y - BALL_R
                    : PENALTY_DIST - BALL_R,
                }}
                transition={{
                  duration: phase === "kicking" || phase === "scored" || phase === "saved" ? 0.4 : 0.2,
                  ease: "easeOut",
                }}
                className="absolute w-10 h-10 rounded-full bg-white border-2 border-slate-300 shadow-lg pointer-events-none flex items-center justify-center"
                style={{ width: BALL_R * 2, height: BALL_R * 2 }}
              >
                <div className="w-2 h-2 rounded-full bg-slate-500" />
              </motion.div>

              {/* Arquero */}
              <motion.div
                animate={{
                  left: keeperDiving === "left"
                    ? 10
                    : keeperDiving === "right"
                    ? GOAL_WIDTH - KEEPER_WIDTH - 10
                    : GOAL_WIDTH / 2 - KEEPER_WIDTH / 2,
                  scaleX: keeperDiving === "right" ? -1 : 1,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                }}
                className="absolute bottom-2 w-20 h-12 flex items-center justify-center pointer-events-none"
                style={{ bottom: 8 }}
              >
                <div className="w-full h-full rounded-lg bg-yellow-400 border-2 border-amber-600 flex items-center justify-center shadow-lg">
                  <span className="text-lg">🧤</span>
                </div>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {phase === "scored" && (
                <motion.div
                  key="scored"
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{
                    opacity: 1,
                    scale: [0.3, 1.2, 1],
                    transition: { duration: 0.5, ease: "easeOut" },
                  }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="text-center mt-4"
                >
                  <p className="font-display text-3xl sm:text-4xl text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse">
                    ¡GOOOL! ⚽
                  </p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-green-300/80 text-sm mt-1"
                  >
                    +1 gol
                  </motion.p>
                </motion.div>
              )}
              {phase === "saved" && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center mt-4"
                >
                  <p className="font-display text-2xl text-red-400">🧤 Atajada</p>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "aim" && (
              <motion.button
                type="button"
                onClick={kick}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 py-4 rounded-xl font-display text-xl text-white bg-amber-500 border-2 border-amber-400/50 hover:bg-amber-600"
              >
                ⚽ Patear
              </motion.button>
            )}

            {phase === "ready" && (
              <p className="text-center text-white/60 font-body text-sm mt-4">
                Toca el arco para apuntar y luego Patear
              </p>
            )}

            <div className="flex gap-3 mt-6 justify-center">
              <motion.button
                type="button"
                onClick={exitToStage1}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl font-body text-sm text-white bg-white/20 border border-white/40 hover:bg-white/30"
              >
                Terminar y guardar
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setTableVisible((v) => !v);
                  if (!tableVisible) {
                    document.getElementById("penales-tabla")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="font-body text-sm text-amber-400 hover:text-amber-300 underline"
              >
                Ver ranking
              </button>
            </div>
          </motion.div>
        )}

        {mounted && tableVisible && (
          <motion.div
            id="penales-tabla"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 mt-6 border border-white/20 scroll-mt-24"
          >
            <p className="font-display text-sm text-white/80 mb-3 uppercase tracking-wider">
              Ranking de goleadores
            </p>
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
                      <td className="py-2 text-right text-amber-400 font-mono font-bold">
                        {g.goals}
                      </td>
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
