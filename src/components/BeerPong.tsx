"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

const LEADERBOARD_KEY = "alamicos_beerpong_leaderboard";

const CANVAS_W = 420;
const CANVAS_H = 280;
const GRAVITY = 0.00042;
const BOUNCE = 0.6;
const BALL_R = 6;
const CUP_R = 14;
const HIT_RADIUS_W = BALL_R / CANVAS_W + CUP_R / CANVAS_W; // mundo
const TABLE_Y = 0.82; // mundo 0-1
const BALL_START = { x: 0.12, y: 0.78 };
const MAX_FORCE = 0.018;
const MIN_FORCE = 0.004;
const FORCE_SCALE = 0.00012;

const TOTAL_CUPS = 6;
const CUP_ROWS = [3, 2, 1];

// Posiciones vasos en mundo (0-1), vista 2D lado derecho
const CUP_CENTERS: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  let i = 0;
  for (let row = 0; row < CUP_ROWS.length; row++) {
    const n = CUP_ROWS[row];
    const baseX = 0.78 + row * 0.02;
    const baseY = 0.22 + row * 0.06;
    for (let j = 0; j < n; j++) {
      const offsetX = (j - (n - 1) / 2) * 0.045;
      out.push({ x: baseX + offsetX, y: baseY });
      i++;
    }
  }
  return out;
})();

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
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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

export default function BeerPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<{
    ballX: number;
    ballY: number;
    ballVx: number;
    ballVy: number;
    lastTime: number;
    rafId: number | null;
  }>({
    ballX: BALL_START.x,
    ballY: BALL_START.y,
    ballVx: 0,
    ballVy: 0,
    lastTime: 0,
    rafId: null,
  });
  const cupsHitRef = useRef<number[]>([]);
  const currentPlayerIdRef = useRef<string | null>(null);
  const participantsRef = useRef<Participant[]>([]);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [cupsHit, setCupsHit] = useState<number[]>([]);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [isAiming, setIsAiming] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [lastResult, setLastResult] = useState<"hit" | "miss" | null>(null);
  const [power, setPower] = useState(0);

  cupsHitRef.current = cupsHit;
  dragStartRef.current = dragStart;
  currentPlayerIdRef.current = currentPlayerId;
  participantsRef.current = participants;

  const remainingCups = TOTAL_CUPS - cupsHit.length;

  // Cargar leaderboard al montar
  useEffect(() => {
    setParticipants(loadLeaderboard());
  }, []);

  // Persistir cuando cambian participantes
  useEffect(() => {
    if (participants.length === 0) return;
    saveLeaderboard(participants);
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
    const next = [...participants, { id, name, score: 0 }];
    setParticipants(next);
    if (!currentPlayerId) setCurrentPlayerId(id);
    setNewName("");
  }, [newName, currentPlayerId, participants]);

  const worldToScreen = useCallback((wx: number, wy: number) => {
    return {
      x: wx * CANVAS_W,
      y: (1 - wy) * CANVAS_H,
    };
  }, []);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    return {
      x: sx / CANVAS_W,
      y: 1 - sy / CANVAS_H,
    };
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const g = gameRef.current!;
      ctx.fillStyle = "#0f1419";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const ty = worldToScreen(0.5, TABLE_Y);
      const tableH = 12;
      const grad = ctx.createLinearGradient(0, ty.y, 0, CANVAS_H);
      grad.addColorStop(0, "#1a2332");
      grad.addColorStop(1, "#0d1219");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, ty.y, CANVAS_W, tableH);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      CUP_CENTERS.forEach((c, i) => {
        if (cupsHitRef.current.includes(i)) return;
        const s = worldToScreen(c.x, c.y);
        const r = CUP_R;
        const cupGrad = ctx.createRadialGradient(
          s.x - r / 2,
          s.y - r / 2,
          0,
          s.x,
          s.y,
          r
        );
        cupGrad.addColorStop(0, "#7f1d1d");
        cupGrad.addColorStop(0.6, "#991b1b");
        cupGrad.addColorStop(1, "#450a0a");
        ctx.fillStyle = cupGrad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,200,200,0.4)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      const ballS = worldToScreen(g.ballX, g.ballY);
      const ballGrad = ctx.createRadialGradient(
        ballS.x - 3,
        ballS.y - 3,
        0,
        ballS.x,
        ballS.y,
        BALL_R + 2
      );
      ballGrad.addColorStop(0, "#fef3c7");
      ballGrad.addColorStop(0.6, "#fde68a");
      ballGrad.addColorStop(1, "#f59e0b");
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ballS.x, ballS.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(251,191,36,0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (isAiming && dragStart && dragEnd) {
        const p1 = worldToScreen(dragStart.x, dragStart.y);
        const p2 = worldToScreen(dragEnd.x, dragEnd.y);
        ctx.strokeStyle = "rgba(251,191,36,0.85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    [isAiming, dragStart, dragEnd, worldToScreen]
  );

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const g = gameRef.current;
    const now = performance.now();
    const dt = Math.min((now - g.lastTime) / 1000, 0.05);
    g.lastTime = now;

    g.ballX += g.ballVx * dt * 60;
    g.ballY += g.ballVy * dt * 60;
    g.ballVy -= GRAVITY * dt * 60;

    if (g.ballY <= TABLE_Y && g.ballVy < 0) {
      g.ballY = TABLE_Y;
      g.ballVy *= -BOUNCE;
      g.ballVx *= 0.95;
    }

    const curCups = cupsHitRef.current;
    const curPlayer = currentPlayerIdRef.current;
    const curParts = participantsRef.current;

    for (let i = 0; i < TOTAL_CUPS; i++) {
      if (curCups.includes(i)) continue;
      const c = CUP_CENTERS[i];
      const dx = g.ballX - c.x;
      const dy = g.ballY - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist < HIT_RADIUS_W) {
        const nextCups = [...curCups, i].sort((a, b) => a - b);
        cupsHitRef.current = nextCups;
        setCupsHit(nextCups);
        setParticipants((prev) =>
          curPlayer
            ? prev.map((p) =>
                p.id === curPlayer ? { ...p, score: p.score + 1 } : p
              )
            : prev
        );
        setLastResult("hit");
        g.ballVx = 0;
        g.ballVy = 0;
        g.ballX = BALL_START.x;
        g.ballY = BALL_START.y;
        setIsFlying(false);
        if (g.rafId != null) cancelAnimationFrame(g.rafId);
        g.rafId = null;
        draw(ctx);
        return;
      }
    }

    if (
      g.ballX < -0.05 ||
      g.ballX > 1.05 ||
      g.ballY < -0.05 ||
      g.ballY > 1.05
    ) {
      setLastResult("miss");
      setLives((prev) => {
        const next = prev - 1;
        if (next <= 0) setGameOver(true);
        return next;
      });
      g.ballVx = 0;
      g.ballVy = 0;
      g.ballX = BALL_START.x;
      g.ballY = BALL_START.y;
      setIsFlying(false);
      if (g.rafId != null) cancelAnimationFrame(g.rafId);
      g.rafId = null;
      draw(ctx);
      return;
    }

    draw(ctx);
    g.rafId = requestAnimationFrame(gameLoop);
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

  const getCanvasRect = useCallback(() => {
    return canvasRef.current?.getBoundingClientRect();
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isFlying || gameOver || remainingCups <= 0 || !currentPlayerId) return;
      const rect = getCanvasRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const wy = 1 - y;
      const wx = x;
      const dx = wx - BALL_START.x;
      const dy = wy - BALL_START.y;
      if (Math.hypot(dx, dy) < 0.08) {
        setIsAiming(true);
        setDragStart({ x: wx, y: wy });
        setDragEnd({ x: wx, y: wy });
      }
    },
    [isFlying, gameOver, remainingCups, currentPlayerId, getCanvasRect]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isAiming || !dragStart) return;
      const rect = getCanvasRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const wy = 1 - y;
      const wx = x;
      const pt = { x: wx, y: wy };
      setDragEnd(pt);
      dragEndRef.current = pt;
      const dx = dragStart.x - wx;
      const dy = dragStart.y - wy;
      const force = Math.hypot(dx, dy) * FORCE_SCALE;
      const pct = Math.min(100, Math.max(0, (force / MAX_FORCE) * 100));
      setPower(pct);
    },
    [isAiming, dragStart, getCanvasRect]
  );

  const doLaunch = useCallback(
    (end: { x: number; y: number }) => {
      const start = dragStart;
      if (!start) return;
      const dx = start.x - end.x;
      const dy = start.y - end.y;
      let force = Math.hypot(dx, dy) * FORCE_SCALE;
      force = Math.max(MIN_FORCE, Math.min(MAX_FORCE, force));
      const angle = Math.atan2(dy, dx);
      const vx = Math.cos(angle) * force;
      const vy = Math.sin(angle) * force;

      const g = gameRef.current;
      g.ballX = BALL_START.x;
      g.ballY = BALL_START.y;
      g.ballVx = vx;
      g.ballVy = vy;

      dragStartRef.current = null;
      dragEndRef.current = null;
      setIsAiming(false);
      setDragStart(null);
      setDragEnd(null);
      setPower(0);
      setLastResult(null);
      setIsFlying(true);
    },
    [dragStart]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isAiming || !dragStart) {
        setIsAiming(false);
        setDragStart(null);
        setDragEnd(null);
        dragEndRef.current = null;
        setPower(0);
        return;
      }
      const end = dragEndRef.current ?? dragEnd ?? dragStart;
      doLaunch(end);
    },
    [isAiming, dragStart, dragEnd, doLaunch]
  );

  useEffect(() => {
    const onUp = () => {
      const start = dragStartRef.current;
      const end = dragEndRef.current;
      if (!start) return;
      const pt = end ?? start;
      setDragStart(null);
      setDragEnd(null);
      dragEndRef.current = null;
      setPower(0);
      const dx = start.x - pt.x;
      const dy = start.y - pt.y;
      const force = Math.hypot(dx, dy) * FORCE_SCALE;
      if (force < MIN_FORCE * 0.5) {
        setIsAiming(false);
        return;
      }
      const f = Math.max(MIN_FORCE, Math.min(MAX_FORCE, force));
      const angle = Math.atan2(dy, dx);
      const g = gameRef.current;
      g.ballX = BALL_START.x;
      g.ballY = BALL_START.y;
      g.ballVx = Math.cos(angle) * f;
      g.ballVy = Math.sin(angle) * f;
      dragStartRef.current = null;
      setIsAiming(false);
      setLastResult(null);
      setIsFlying(true);
    };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  const resetCups = useCallback(() => {
    setCupsHit([]);
    setLastResult(null);
    gameRef.current.ballX = BALL_START.x;
    gameRef.current.ballY = BALL_START.y;
    gameRef.current.ballVx = 0;
    gameRef.current.ballVy = 0;
  }, []);

  const startNewGame = useCallback(() => {
    setGameOver(false);
    setLives(3);
    setCupsHit([]);
    setLastResult(null);
    gameRef.current.ballX = BALL_START.x;
    gameRef.current.ballY = BALL_START.y;
    gameRef.current.ballVx = 0;
    gameRef.current.ballVy = 0;
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && !isFlying) draw(ctx);
  }, [draw, isFlying, cupsHit, lives]);

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
          Arrastra desde la pelota hacia atrás para apuntar y regular la fuerza · 3 vidas
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
              <div className="font-mono text-white/70 text-sm">
                Vasos: {remainingCups}/{TOTAL_CUPS}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                      i <= lives
                        ? "bg-red-500/80 text-white"
                        : "bg-white/10 text-white/30"
                    }`}
                    title="Vidas"
                  >
                    {i <= lives ? "♥" : "♡"}
                  </span>
                ))}
              </div>
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

          {gameOver ? (
            <div className="rounded-xl bg-black/50 border-2 border-red-500/50 p-8 text-center">
              <p className="font-display text-2xl text-red-400 mb-2">
                Game Over
              </p>
              <p className="font-body text-white/80 mb-6">
                Te quedaste sin vidas. Los puntajes siguen guardados.
              </p>
              <motion.button
                onClick={startNewGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-xl font-display text-lg text-white bg-red-500 border border-red-400/50 hover:bg-red-600 transition-colors"
              >
                JUGAR DE NUEVO
              </motion.button>
            </div>
          ) : (
            <>
              {isAiming && power > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-white/60 font-mono mb-1">
                    <span>Fuerza</span>
                    <span>{Math.round(power)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500"
                      initial={false}
                      animate={{ width: `${power}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </div>
                </div>
              )}

              <div
                className="relative mx-auto rounded-xl overflow-hidden border-2 border-white/20 bg-black/40 touch-none"
                style={{ width: CANVAS_W, height: CANVAS_H }}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="w-full h-full block cursor-crosshair"
                  style={{ maxWidth: "100%", height: "auto" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
              </div>

              <p className="text-center text-white/50 text-xs font-body mt-2">
                Arrastra desde la pelota hacia atrás y suelta para lanzar
              </p>

              <AnimatePresence mode="wait">
                {lastResult === "hit" && (
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

              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <motion.button
                  onClick={resetCups}
                  disabled={isFlying}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-4 rounded-xl font-body text-sm text-white/90 border border-white/30 hover:bg-white/10 transition-colors disabled:opacity-50"
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
