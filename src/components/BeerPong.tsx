"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

const LEADERBOARD_KEY = "alamicos_beerpong_leaderboard";

// --- Mundo 3D: x = adelante, y = lateral, z = altura ---
const TABLE_LEN = 1;
const GRAVITY = 0.014;
const BOUNCE = 0.5;
const BALL_START = { x: 0.05, y: 0, z: 0.02 };
const V0 = 0.12; // velocidad base del lanzamiento
const CUP_R = 0.045; // radio vaso (mundo)
const TOTAL_CUPS = 6;

// Vasos en 3D (x, y) — triángulo clásico visto desde arriba
const CUP_POS: { x: number; y: number }[] = [
  { x: 0.78, y: -0.06 },
  { x: 0.78, y: 0 },
  { x: 0.78, y: 0.06 },
  { x: 0.84, y: -0.03 },
  { x: 0.84, y: 0.03 },
  { x: 0.90, y: 0 },
];

const CANVAS_W = 400;
const CANVAS_H = 220;

export interface Participant {
  id: string;
  name: string;
  score: number;
}

function generateId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadLeaderboard(): Participant[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLeaderboard(data: Participant[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
  } catch {}
}

// Simula trayectoria para previsualización
function simulatePath(
  angleDeg: number,
  power: number,
  steps: number
): { x: number; z: number }[] {
  const rad = (angleDeg * Math.PI) / 180;
  const vx = V0 * power * Math.cos(rad);
  let vz = V0 * power * Math.sin(rad);
  let x = BALL_START.x;
  let y = BALL_START.y;
  let z = BALL_START.z;
  const path: { x: number; z: number }[] = [{ x, z }];
  const dt = 0.02;
  for (let i = 0; i < steps; i++) {
    x += vx * dt;
    z += vz * dt;
    vz -= GRAVITY * dt;
    if (z <= 0) break;
    path.push({ x, z });
  }
  return path;
}

export default function BeerPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<{
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    lastTime: number;
    rafId: number | null;
  }>({
    ...BALL_START,
    vx: 0,
    vy: 0,
    vz: 0,
    lastTime: 0,
    rafId: null,
  });
  const cupsHitRef = useRef<number[]>([]);
  const currentPlayerIdRef = useRef<string | null>(null);
  const participantsRef = useRef<Participant[]>([]);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [cupsHit, setCupsHit] = useState<number[]>([]);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [angle, setAngle] = useState(48);
  const [power, setPower] = useState(0.65);
  const [lastResult, setLastResult] = useState<"hit" | "miss" | null>(null);

  cupsHitRef.current = cupsHit;
  currentPlayerIdRef.current = currentPlayerId;
  participantsRef.current = participants;

  const remainingCups = TOTAL_CUPS - cupsHit.length;

  useEffect(() => {
    setParticipants(loadLeaderboard());
  }, []);

  useEffect(() => {
    if (participants.length > 0) saveLeaderboard(participants);
  }, [participants]);

  const addParticipant = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    const existing = participants.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setCurrentPlayerId(existing.id);
      setNewName("");
      return;
    }
    const id = generateId();
    setParticipants((prev) => [...prev, { id, name, score: 0 }]);
    if (!currentPlayerId) setCurrentPlayerId(id);
    setNewName("");
  }, [newName, currentPlayerId, participants]);

  const worldToScreen = useCallback((wx: number, wz: number) => {
    const margin = 24;
    const scaleX = (CANVAS_W - margin * 2) / TABLE_LEN;
    const scaleZ = (CANVAS_H - margin * 2) / 0.35;
    return {
      x: margin + wx * scaleX,
      y: CANVAS_H - margin - wz * scaleZ,
    };
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, showPreview: boolean) => {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const g = gameRef.current;

      // Mesa (trapecio estilo NES)
      const tLeft = worldToScreen(0, 0);
      const tRight = worldToScreen(TABLE_LEN, 0);
      ctx.fillStyle = "#2d2d44";
      ctx.beginPath();
      ctx.moveTo(tLeft.x, tLeft.y);
      ctx.lineTo(tRight.x, tRight.y);
      ctx.lineTo(tRight.x, CANVAS_H);
      ctx.lineTo(tLeft.x, CANVAS_H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#4a4a6a";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vasos (columnas en vista lateral)
      const cupXs = [0.78, 0.84, 0.9];
      const cupCounts = [3, 2, 1];
      let cupIdx = 0;
      cupXs.forEach((cx, col) => {
        const n = cupCounts[col];
        const s = worldToScreen(cx, 0);
        const r = 10;
        for (let i = 0; i < n; i++) {
          if (cupsHitRef.current.includes(cupIdx)) {
            cupIdx++;
            continue;
          }
          const sy = s.y - i * 6 - r;
          ctx.fillStyle = "#8b0000";
          ctx.beginPath();
          ctx.arc(s.x, sy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#b22222";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#fff8dc";
          ctx.font = "10px monospace";
          ctx.fillText("🍺", s.x - 4, sy + 4);
          cupIdx++;
        }
      });

      // Previsualización de trayectoria
      if (showPreview && !isFlying) {
        const path = simulatePath(angle, power, 80);
        ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        path.forEach((p, i) => {
          const s = worldToScreen(p.x, p.z);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Pelota
      const ballS = worldToScreen(g.x, g.z);
      const br = 6;
      ctx.fillStyle = "#f5f5dc";
      ctx.beginPath();
      ctx.arc(ballS.x, ballS.y, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#daa520";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [angle, power, isFlying, worldToScreen]
  );

  const gameLoop = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;
    const now = performance.now();
    const dt = Math.min((now - g.lastTime) / 1000, 0.04);
    g.lastTime = now;

    g.x += g.vx * dt * 60;
    g.y += g.vy * dt * 60;
    g.z += g.vz * dt * 60;
    g.vz -= GRAVITY * dt * 60;

    if (g.z <= 0) {
      g.z = 0;
      g.vz *= -BOUNCE;
      g.vx *= 0.92;

      const curCups = cupsHitRef.current;
      const curPlayer = currentPlayerIdRef.current;

      for (let i = 0; i < TOTAL_CUPS; i++) {
        if (curCups.includes(i)) continue;
        const c = CUP_POS[i];
        const dist = Math.hypot(g.x - c.x, g.y - c.y);
        if (dist < CUP_R) {
          cupsHitRef.current = [...curCups, i].sort((a, b) => a - b);
          setCupsHit(cupsHitRef.current);
          setParticipants((prev) =>
            curPlayer
              ? prev.map((p) =>
                  p.id === curPlayer ? { ...p, score: p.score + 1 } : p
                )
              : prev
          );
          setLastResult("hit");
          g.vx = 0;
          g.vy = 0;
          g.vz = 0;
          g.x = BALL_START.x;
          g.y = BALL_START.y;
          g.z = BALL_START.z;
          setIsFlying(false);
          if (g.rafId != null) cancelAnimationFrame(g.rafId);
          g.rafId = null;
          draw(ctx, true);
          return;
        }
      }
    }

    if (g.x < -0.05 || g.x > TABLE_LEN + 0.05 || g.z > 0.5) {
      setLastResult("miss");
      setLives((prev) => {
        const next = prev - 1;
        if (next <= 0) setGameOver(true);
        return next;
      });
      g.vx = 0;
      g.vy = 0;
      g.vz = 0;
      g.x = BALL_START.x;
      g.y = BALL_START.y;
      g.z = BALL_START.z;
      setIsFlying(false);
      if (g.rafId != null) cancelAnimationFrame(g.rafId);
      g.rafId = null;
      draw(ctx, true);
      return;
    }

    draw(ctx, false);
    gameRef.current.rafId = requestAnimationFrame(gameLoop);
  }, [draw]);

  useEffect(() => {
    if (!isFlying) return;
    gameRef.current.lastTime = performance.now();
    gameRef.current.rafId = requestAnimationFrame(gameLoop);
    return () => {
      if (gameRef.current.rafId != null)
        cancelAnimationFrame(gameRef.current.rafId);
    };
  }, [isFlying, gameLoop]);

  const launch = useCallback(() => {
    if (isFlying || gameOver || remainingCups <= 0 || !currentPlayerId) return;
    const rad = (angle * Math.PI) / 180;
    const vx = V0 * power * Math.cos(rad);
    const vz = V0 * power * Math.sin(rad);
    const g = gameRef.current;
    g.x = BALL_START.x;
    g.y = BALL_START.y;
    g.z = BALL_START.z;
    g.vx = vx;
    g.vy = 0;
    g.vz = vz;
    setLastResult(null);
    setIsFlying(true);
  }, [angle, power, isFlying, gameOver, remainingCups, currentPlayerId]);

  const resetCups = useCallback(() => {
    setCupsHit([]);
    setLastResult(null);
    cupsHitRef.current = [];
    const g = gameRef.current;
    g.x = BALL_START.x;
    g.y = BALL_START.y;
    g.z = BALL_START.z;
    g.vx = 0;
    g.vy = 0;
    g.vz = 0;
  }, []);

  const startNewGame = useCallback(() => {
    setGameOver(false);
    setLives(3);
    setCupsHit([]);
    cupsHitRef.current = [];
    setLastResult(null);
    const g = gameRef.current;
    g.x = BALL_START.x;
    g.y = BALL_START.y;
    g.z = BALL_START.z;
    g.vx = 0;
    g.vy = 0;
    g.vz = 0;
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, true);
  }, [draw, cupsHit, lives]);

  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  return (
    <section id="beerpong" className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-green/95 via-red-950/30 to-violet-950/95" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(255,255,255,0.15) 24px, rgba(255,255,255,0.15) 26px)`,
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
          Estilo NES · Ajusta ángulo y fuerza y lanza hacia adelante
        </motion.p>

        <div className="flex flex-wrap gap-2 mb-4">
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
        </div>

        {participants.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-4 mb-4 border border-white/20"
          >
            <p className="font-display text-sm text-white/80 mb-3 uppercase tracking-wider">
              Tabla de puntajes (guardados)
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
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="font-mono text-white/70 text-sm">
                Vasos: {remainingCups}/{TOTAL_CUPS}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                      i <= lives ? "bg-red-500/80 text-white" : "bg-white/10 text-white/30"
                    }`}
                  >
                    {i <= lives ? "♥" : "♡"}
                  </span>
                ))}
              </div>
            </div>
            {currentPlayerId && (
              <span className="font-body text-sm text-white/80">
                Lanzando:{" "}
                <span className="text-amber-400 font-medium">
                  {participants.find((p) => p.id === currentPlayerId)?.name}
                </span>
              </span>
            )}
          </div>

          {gameOver ? (
            <div className="rounded-xl bg-black/50 border-2 border-red-500/50 p-8 text-center">
              <p className="font-display text-2xl text-red-400 mb-2">GAME OVER</p>
              <p className="font-body text-white/80 mb-6">
                Sin vidas. Los puntajes siguen guardados.
              </p>
              <motion.button
                onClick={startNewGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-xl font-display text-lg text-white bg-red-500 border border-red-400/50 hover:bg-red-600"
              >
                JUGAR DE NUEVO
              </motion.button>
            </div>
          ) : (
            <>
              <div
                className="mx-auto rounded border-2 border-amber-500/40 bg-[#1a1a2e] overflow-hidden"
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  imageRendering: "pixelated",
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="block w-full h-auto"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="flex justify-between text-xs text-amber-200/90 font-mono mb-1">
                    <span>ÁNGULO (más = más alto)</span>
                    <span>{angle}°</span>
                  </label>
                  <input
                    type="range"
                    min={28}
                    max={68}
                    value={angle}
                    onChange={(e) => setAngle(Number(e.target.value))}
                    disabled={isFlying}
                    className="w-full h-3 rounded-full bg-white/10 accent-amber-500"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-amber-200/90 font-mono mb-1">
                    <span>FUERZA</span>
                    <span>{Math.round(power * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0.35}
                    max={0.95}
                    step={0.02}
                    value={power}
                    onChange={(e) => setPower(Number(e.target.value))}
                    disabled={isFlying}
                    className="w-full h-3 rounded-full bg-white/10 accent-red-500"
                  />
                </div>

                <p className="text-center text-white/50 text-xs">
                  Línea amarilla = trayectoria prevista
                </p>

                <motion.button
                  onClick={launch}
                  disabled={isFlying || remainingCups <= 0 || !currentPlayerId}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl font-display text-xl tracking-wider text-white bg-red-600 border-2 border-red-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
                >
                  LANZAR
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {lastResult === "hit" && (
                  <motion.p
                    key="hit"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-amber-400 font-display text-xl mt-3"
                  >
                    ¡PUNTO!
                  </motion.p>
                )}
                {lastResult === "miss" && (
                  <motion.p
                    key="miss"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-red-400 font-body text-sm mt-3"
                  >
                    Fallo · -1 vida
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex justify-center mt-4">
                <motion.button
                  onClick={resetCups}
                  disabled={isFlying}
                  className="px-6 py-3 rounded-xl font-body text-sm text-white/90 border border-white/30 hover:bg-white/10 disabled:opacity-50"
                >
                  Reiniciar vasos
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
