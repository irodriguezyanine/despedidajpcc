"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const API_LEADERBOARD = "/api/penales/leaderboard";
const LEADERBOARD_KEY = "alamicos_penales_leaderboard";

const TOTAL_SHOTS = 3;
const INITIAL_LIVES = 3;
const MAX_LIVES = 6;

const PhaserGame = dynamic(() => import("@/game/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-[#0d2818]" style={{ width: 360, height: 600 }}>
      <p className="text-white/60 font-body text-sm">Cargando juego...</p>
    </div>
  ),
});

interface Participant {
  id: string;
  name: string;
  score: number;
  playedAt?: string;
}

const SANTIAGO_TZ = "America/Santiago";

function formatPlayedAt(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat("es-CL", {
      timeZone: SANTIAGO_TZ,
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(d);
    const hour = parts.find((p) => p.type === "hour")?.value ?? "—";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "—";
    const day = parts.find((p) => p.type === "day")?.value ?? "—";
    const month = parts.find((p) => p.type === "month")?.value ?? "—";
    return `${hour}:${minute} ${day}/${month}`;
  } catch {
    return "—";
  }
}

function generateId() {
  return `penales_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function loadLeaderboardLocal(): { data: Participant[]; hadKey: boolean } {
  if (typeof window === "undefined") return { data: [], hadKey: false };
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw === null || raw === undefined) return { data: [], hadKey: false };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { data: [], hadKey: true };
    const data = parsed.filter((p) => p && typeof p.id === "string" && typeof p.name === "string" && typeof p.score === "number");
    return { data, hadKey: true };
  } catch {
    return { data: [], hadKey: true };
  }
}

function saveLeaderboardLocal(data: Participant[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
  } catch {}
}

async function fetchLeaderboard(): Promise<{ data: Participant[]; useLocalStorage?: boolean }> {
  try {
    const res = await fetch(API_LEADERBOARD);
    const json = await res.json();
    return { data: Array.isArray(json?.data) ? json.data : [], useLocalStorage: json?.useLocalStorage };
  } catch {
    return { data: [], useLocalStorage: true };
  }
}

async function saveLeaderboardToServer(data: Participant[]): Promise<Participant[] | null> {
  try {
    const res = await fetch(API_LEADERBOARD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : null;
  } catch {
    return null;
  }
}

export default function Penales() {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<1 | 2>(1);
  const [newName, setNewName] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [tableVisible, setTableVisible] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);
  const [lastResult, setLastResult] = useState<"goal" | "saved" | null>(null);
  const [useLocalStorageOnly, setUseLocalStorageOnly] = useState(true);

  const remainingShots = TOTAL_SHOTS - attempts;

  const persistLeaderboard = useCallback((data: Participant[]) => {
    if (data.length === 0) return;
    if (useLocalStorageOnly) {
      saveLeaderboardLocal(data);
    } else {
      saveLeaderboardToServer(data);
    }
  }, [useLocalStorageOnly]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasLoadedLeaderboardRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || hasLoadedLeaderboardRef.current) return;
    hasLoadedLeaderboardRef.current = true;

    (async () => {
      const { data: apiData, useLocalStorage } = await fetchLeaderboard();
      setUseLocalStorageOnly(!!useLocalStorage);

      if (!useLocalStorage && apiData.length > 0) {
        setParticipants(apiData);
        setCurrentPlayerId((prev) => prev || apiData[0].id);
        return;
      }

      const { data: saved, hadKey } = loadLeaderboardLocal();
      if (saved.length > 0) {
        setParticipants(saved);
        setCurrentPlayerId((prev) => prev || saved[0].id);
        return;
      }
      if (hadKey) {
        setParticipants([]);
        return;
      }
      setParticipants([]);
    })();
  }, []);

  useEffect(() => {
    if (participants.length > 0) persistLeaderboard(participants);
  }, [participants, persistLeaderboard]);

  useEffect(() => {
    if (gameOver && participants.length > 0) persistLeaderboard(participants);
  }, [gameOver, participants, persistLeaderboard]);

  const onStartClick = () => {
    const n = newName.trim();
    if (!n) return;
    setShowInstruction(true);
  };

  const startGame = useCallback(() => {
    setShowInstruction(false);
    const name = newName.trim();
    if (!name) return;
    const id = generateId();
    const newEntry: Participant = { id, name, score: 0, playedAt: new Date().toISOString() };
    setParticipants((prev) => [...prev, newEntry]);
    setCurrentPlayerId(id);
    setNewName("");
    setStage(2);
    setLives(INITIAL_LIVES);
    setAttempts(0);
    setGameOver(false);
    setLastResult(null);
  }, [newName]);

  const exitToStage1 = useCallback(() => {
    setStage(1);
    setGameOver(false);
  }, []);

  const handleGoal = useCallback(() => {
    if (gameOver) return;
    setAttempts((a) => a + 1);
    setLastResult("goal");
    setLives((prev) => Math.min(prev + 1, MAX_LIVES));
    setParticipants((prev) =>
      currentPlayerId
        ? prev.map((p) => (p.id === currentPlayerId ? { ...p, score: p.score + 1 } : p))
        : prev
    );
  }, [gameOver, currentPlayerId]);

  const handleSaved = useCallback(() => {
    if (gameOver) return;
    setAttempts((a) => a + 1);
    setLastResult("saved");
    setLives((prev) => {
      const next = prev - 1;
      if (next <= 0) setGameOver(true);
      return next;
    });
  }, [gameOver]);

  const startNewGame = useCallback(() => {
    const currentPlayer = participants.find((p) => p.id === currentPlayerId);
    if (currentPlayer) {
      const newParticipant: Participant = {
        id: generateId(),
        name: currentPlayer.name,
        score: 0,
        playedAt: new Date().toISOString(),
      };
      setParticipants((prev) => [...prev, newParticipant]);
      setCurrentPlayerId(newParticipant.id);
    }
    setGameOver(false);
    setLives(INITIAL_LIVES);
    setAttempts(0);
    setLastResult(null);
  }, [participants, currentPlayerId]);

  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  const getDisplayName = (name: string, index: number) => {
    const sameNameCount = sortedParticipants
      .slice(0, index + 1)
      .filter((p) => p.name === name).length;
    return sameNameCount > 1 ? `${name} (intento ${sameNameCount})` : name;
  };

  const currentScore = currentPlayerId
    ? participants.find((p) => p.id === currentPlayerId)?.score ?? 0
    : 0;
  const currentRank =
    sortedParticipants.findIndex((p) => p.id === currentPlayerId) + 1 || 0;

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
          Juego de penales con Phaser · 3 penales · Gol +1 vida · Atajada -1 vida
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
                <p className="font-body text-white/90 text-sm mb-4">Toca el arco para apuntar y mantén presionado para cargar, suelta para patear.</p>
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
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onStartClick()} placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:border-amber-400/50 mb-6" />
            <motion.button type="button" onClick={onStartClick} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-8 py-4 rounded-xl font-display text-lg text-white bg-amber-500 border border-amber-400/50 hover:bg-amber-600">
              Jugar
            </motion.button>
            <button type="button" onClick={() => { setTableVisible((v) => !v); if (!tableVisible) requestAnimationFrame(() => document.getElementById("penales-tabla")?.scrollIntoView({ behavior: "smooth" })); }} className="mt-6 inline-block font-body text-sm text-amber-400 hover:text-amber-300 underline transition-colors">
              {tableVisible ? "Ocultar tabla" : "Ver tabla"}
            </button>
          </motion.div>
        )}

        {stage === 2 && mounted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-amber-500/40 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span className="font-mono text-white/70 text-sm">
                  Penales: {remainingShots}/{TOTAL_SHOTS}
                </span>
                <div className="flex items-center gap-1.5" title={`Vidas: ${lives}`}>
                  {Array.from({ length: Math.max(INITIAL_LIVES, lives) }, (_, i) => i + 1).map((i) => (
                    <span
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-base ${
                        i <= lives ? "opacity-100" : "opacity-25"
                      }`}
                      aria-hidden
                    >
                      ⚽
                    </span>
                  ))}
                </div>
              </div>
              {currentPlayerId && (
                <span className="font-body text-sm text-white/80">
                  Jugando: <span className="text-amber-400 font-medium">{participants.find((p) => p.id === currentPlayerId)?.name}</span>
                </span>
              )}
            </div>

            <div className="relative mx-auto rounded-xl border-2 border-white/20 overflow-hidden touch-none select-none" style={{ maxWidth: 360, minHeight: 600 }}>
              <PhaserGame className="w-full" onGoal={handleGoal} onSaved={handleSaved} disabled={gameOver || attempts >= TOTAL_SHOTS} />
              {gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/85 rounded-xl p-6 z-20">
                  <div className="text-center">
                    <p className="font-display text-2xl text-red-400 mb-2">GAME OVER</p>
                    <p className="font-body text-white/80 text-sm mb-1">
                      Puntaje: <span className="font-bold text-amber-400">{currentScore}</span>
                    </p>
                    <p className="font-body text-white/70 text-xs mb-6">
                      Puesto {currentRank}º en la tabla
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <motion.button
                        onClick={startNewGame}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 rounded-xl font-display text-base text-white bg-amber-500 border border-amber-400/50 hover:bg-amber-600"
                      >
                        Seguir jugando
                      </motion.button>
                      <motion.button
                        onClick={exitToStage1}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 rounded-xl font-display text-base text-white bg-white/20 border border-white/40 hover:bg-white/30"
                      >
                        Salir
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
              {!gameOver && attempts >= TOTAL_SHOTS && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl p-6 z-20">
                  <div className="text-center">
                    <p className="font-display text-2xl text-amber-400 mb-2">¡Ronda completada!</p>
                    <p className="font-body text-white/80 text-sm mb-6">
                      Puntaje: <span className="font-bold text-amber-400">{currentScore}</span> goles
                    </p>
                    <motion.button
                      onClick={exitToStage1}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 rounded-xl font-display text-base text-white bg-amber-500 border border-amber-400/50 hover:bg-amber-600"
                    >
                      Terminar y guardar
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {lastResult === "goal" && (
                <motion.p
                  key="goal"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-amber-400 font-display text-xl mt-3"
                >
                  ¡GOOOL! +1 vida
                </motion.p>
              )}
              {lastResult === "saved" && (
                <motion.p
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-red-400 font-body text-sm mt-3"
                >
                  Atajada · -1 vida
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex gap-3 mt-6 justify-center">
              <motion.button type="button" onClick={exitToStage1} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl font-body text-sm text-white bg-white/20 border border-white/40 hover:bg-white/30">
                Terminar y guardar
              </motion.button>
              <button type="button" onClick={() => { setTableVisible((v) => !v); if (!tableVisible) document.getElementById("penales-tabla")?.scrollIntoView({ behavior: "smooth" }); }} className="font-body text-sm text-amber-400 hover:text-amber-300 underline">
                Ver tabla
              </button>
            </div>
          </motion.div>
        )}

        {mounted && tableVisible && (
          <motion.div id="penales-tabla" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 mt-6 border border-white/20 scroll-mt-24">
            <p className="font-display text-sm text-white/80 mb-3 uppercase tracking-wider">Tabla de puntajes (guardados)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="text-white/60 border-b border-white/10">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3 text-center">Hora</th>
                    <th className="py-2 text-right">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`border-b border-white/5 last:border-0 ${p.id === currentPlayerId ? "bg-amber-500/15" : ""}`}
                    >
                      <td className="py-2 pr-3 text-white/70">{idx + 1}</td>
                      <td className="py-2 pr-3 text-white font-medium">{getDisplayName(p.name, idx)}</td>
                      <td className="py-2 pr-3 text-white/60 text-center font-mono text-xs">{formatPlayedAt(p.playedAt)}</td>
                      <td className="py-2 text-right text-amber-400 font-mono font-bold">{p.score}</td>
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
