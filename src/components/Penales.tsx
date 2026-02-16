"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_LEADERBOARD = "/api/penales/leaderboard";

const CANVAS_W = 360;
const CANVAS_H = 520;
const BALL_R = 10;
const PULL_SCALE = 0.12;
const PULL_SCALE_MOBILE = 0.125;
const MAX_SPEED = 32;
const MIN_PULL = 18;
const GRAVITY = 0.35;
const FRICTION_AIR = 0.998;

const GOAL_TOP = 25;
const GOAL_HEIGHT = 110;
const GOAL_WIDTH = 240;
const GOAL_LEFT = (CANVAS_W - GOAL_WIDTH) / 2;

const BALL_START_X = CANVAS_W / 2;
const BALL_START_Y = CANVAS_H - 95;

const TOTAL_PENALTIES = 5;

type GamePhase = "aim" | "height" | "effect" | "flying" | "scored" | "saved" | "finished";
type HeightOption = "bajo" | "medio" | "alto";
type EffectOption = "izq" | "centro" | "der";

interface Goleador {
  id: string;
  name: string;
  goals: number;
  updatedAt?: string;
}

interface ShotParams {
  vx: number;
  vy: number;
  height: HeightOption;
  effect: EffectOption;
}

function generateClientId(): string {
  return `penales_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function haptic(type: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const ms = type === "heavy" ? 30 : type === "medium" ? 20 : 10;
  navigator.vibrate(ms);
}

function getKeeperHitbox(
  keeperDive: "left" | "center" | "right" | null,
  elapsed: number
): { x: number; y: number; w: number; h: number; handL: { x: number; y: number; r: number }; handR: { x: number; y: number; r: number } } {
  const goalCenter = GOAL_LEFT + GOAL_WIDTH / 2;
  const keeperY = GOAL_TOP + GOAL_HEIGHT * 0.4;
  const bodyW = 50;
  const bodyH = 35;
  const handR = 18;

  const diveDuration = 0.25;
  const progress = Math.min(elapsed / diveDuration, 1);
  const easeOut = 1 - Math.pow(1 - progress, 2);

  let centerX = goalCenter;
  if (keeperDive === "left") {
    centerX = goalCenter - 70 * easeOut;
  } else if (keeperDive === "right") {
    centerX = goalCenter + 70 * easeOut;
  }

  const handLOffset = keeperDive === "left" ? -35 : keeperDive === "right" ? -25 : -30;
  const handROffset = keeperDive === "left" ? 25 : keeperDive === "right" ? 35 : 30;

  return {
    x: centerX - bodyW / 2,
    y: keeperY - bodyH / 2,
    w: bodyW,
    h: bodyH,
    handL: { x: centerX + handLOffset, y: keeperY - 5, r: handR },
    handR: { x: centerX + handROffset, y: keeperY - 5, r: handR },
  };
}

function circleRectCollision(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number): boolean {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  return Math.hypot(cx - nearestX, cy - nearestY) <= r;
}

function circleCircleCollision(cx: number, cy: number, cr: number, ox: number, oy: number, or: number): boolean {
  return Math.hypot(cx - ox, cy - oy) <= cr + or;
}

export default function Penales() {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("aim");
  const [goleadores, setGoleadores] = useState<Goleador[]>([]);
  const [tableVisible, setTableVisible] = useState(false);
  const [lastResult, setLastResult] = useState<"goal" | "saved" | null>(null);
  const [keeperDiving, setKeeperDiving] = useState<"left" | "center" | "right" | null>(null);
  const [heightSel, setHeightSel] = useState<HeightOption>("medio");
  const [effectSel, setEffectSel] = useState<EffectOption>("centro");
  const [pendingShot, setPendingShot] = useState<ShotParams | null>(null);

  const gameRef = useRef({
    x: BALL_START_X,
    y: BALL_START_Y,
    vx: 0,
    vy: 0,
    lastTime: 0,
    rafId: null as number | null,
    shotStartTime: 0,
    keeperTouchedBall: false,
  });
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const pullLineRafRef = useRef<number | null>(null);
  const ballSelectedRef = useRef(false);
  const [pullLine, setPullLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [ballSelected, setBallSelected] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasScaleRef = useRef(1);
  const keeperDiveRef = useRef<"left" | "center" | "right">("center");

  const remainingPenalties = TOTAL_PENALTIES - attempts;

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

  useEffect(() => {
    if (stage !== 2 || !mounted) {
      setShowCanvas(false);
      return;
    }
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setShowCanvas(true));
    });
    return () => cancelAnimationFrame(t);
  }, [stage, mounted]);

  const startGame = () => {
    const n = name.trim();
    if (!n) return;
    setClientId(generateClientId());
    setScore(0);
    setAttempts(0);
    setStage(2);
    setPhase("aim");
    setPendingShot(null);
    const g = gameRef.current;
    g.x = BALL_START_X;
    g.y = BALL_START_Y;
    g.vx = 0;
    g.vy = 0;
  };

  const pickKeeperDirection = useCallback((): "left" | "center" | "right" => {
    const r = Math.random();
    if (r < 0.35) return "left";
    if (r < 0.65) return "center";
    return "right";
  }, []);

  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const el = canvasRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const dpr = canvasScaleRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const g = gameRef.current;

      // Cielo / gradas (fondo)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, "#1e3a5f");
      skyGrad.addColorStop(0.3, "#2563eb");
      skyGrad.addColorStop(0.6, "#0ea5e9");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H * 0.5);

      // PÚBLICO (gradas detrás del arco)
      const crowdTop = 0;
      const crowdH = 140;
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, crowdTop, CANVAS_W, crowdH);
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 24; col++) {
          const colors = ["#dc2626", "#f59e0b", "#ffffff", "#1e293b", "#0ea5e9", "#22c55e"];
          ctx.fillStyle = colors[(row * 3 + col) % colors.length];
          ctx.beginPath();
          ctx.arc(15 + col * 15, 20 + row * 16, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Césped
      const grassGrad = ctx.createLinearGradient(0, CANVAS_H * 0.4, 0, CANVAS_H);
      grassGrad.addColorStop(0, "#166534");
      grassGrad.addColorStop(0.5, "#15803d");
      grassGrad.addColorStop(1, "#14532d");
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, CANVAS_H * 0.4, CANVAS_W, CANVAS_H);

      // Líneas de la cancha
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, CANVAS_H);
      ctx.lineTo(CANVAS_W - 30, CANVAS_H);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, BALL_START_Y + 30, 40, 0, Math.PI * 2);
      ctx.stroke();

      // PORTERÍA
      const goalLeft = GOAL_LEFT;
      const goalRight = GOAL_LEFT + GOAL_WIDTH;
      const goalBottom = GOAL_TOP + GOAL_HEIGHT;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(goalLeft, goalBottom);
      ctx.lineTo(goalLeft, GOAL_TOP);
      ctx.lineTo(goalRight, GOAL_TOP);
      ctx.lineTo(goalRight, goalBottom);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      const netSpacing = 10;
      for (let i = 0; i <= GOAL_WIDTH; i += netSpacing) {
        ctx.beginPath();
        ctx.moveTo(goalLeft + i, goalBottom);
        ctx.lineTo(goalLeft + i, GOAL_TOP);
        ctx.stroke();
      }
      for (let j = 0; j <= GOAL_HEIGHT; j += netSpacing) {
        ctx.beginPath();
        ctx.moveTo(goalLeft, goalBottom - j);
        ctx.lineTo(goalRight, goalBottom - j);
        ctx.stroke();
      }

      // PORTERO (cuerpo completo: brazos, piernas)
      const keeperDivesLeft = keeperDiving === "left";
      const keeperDivesRight = keeperDiving === "right";
      const elapsed = g.shotStartTime ? (performance.now() - g.shotStartTime) / 1000 : 0;
      const hitbox = getKeeperHitbox(keeperDiving, elapsed);

      const keeperCenterX = hitbox.x + hitbox.w / 2;
      const keeperY = hitbox.y + hitbox.h / 2;

      ctx.save();
      ctx.translate(keeperCenterX, keeperY);
      if (keeperDiving) {
        ctx.rotate(keeperDivesLeft ? -0.2 : keeperDivesRight ? 0.2 : 0);
      }
      ctx.translate(-keeperCenterX, -keeperY);

      // Piernas
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(keeperCenterX - 18, keeperY + 12, 10, 25);
      ctx.fillRect(keeperCenterX + 8, keeperY + 12, 10, 25);

      // Cuerpo (camiseta naranja)
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(keeperCenterX - 22, keeperY - 18, 44, 35);
      ctx.strokeStyle = "#c2410c";
      ctx.lineWidth = 2;
      ctx.strokeRect(keeperCenterX - 22, keeperY - 18, 44, 35);

      // Brazos / guantes
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.ellipse(hitbox.handL.x, hitbox.handL.y, 12, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(hitbox.handR.x, hitbox.handR.y, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cabeza
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(keeperCenterX, keeperY - 25, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // JUGADOR (vista desde atrás: cuerpo completo con camiseta rayada)
      const playerX = CANVAS_W / 2;
      const playerY = CANVAS_H - 55;

      ctx.save();
      ctx.translate(playerX, playerY);

      // Piernas (short negro)
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-12, 15, 10, 45);
      ctx.fillRect(2, 15, 10, 45);

      // Cuerpo (camiseta blanca y roja a rayas)
      const stripeW = 5;
      for (let i = -25; i < 25; i += stripeW) {
        ctx.fillStyle = (i / stripeW) % 2 === 0 ? "#ffffff" : "#dc2626";
        ctx.fillRect(i, -35, stripeW + 1, 55);
      }

      // Brazos (mangas rayadas)
      ctx.save();
      ctx.translate(-28, -15);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#dc2626";
        ctx.fillRect(i * 4, 0, 5, 35);
      }
      ctx.restore();
      ctx.save();
      ctx.translate(23, -15);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#dc2626";
        ctx.fillRect(i * 4, 0, 5, 35);
      }
      ctx.restore();

      // Cabeza
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(0, -45, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Línea de tiro
      if (pullLine) {
        const dx = pullLine.x2 - pullLine.x1;
        const dy = pullLine.y2 - pullLine.y1;
        const len = Math.hypot(dx, dy);
        const speed = Math.min(len * PULL_SCALE, MAX_SPEED);
        ctx.strokeStyle = speed > MAX_SPEED * 0.6 ? "rgba(239, 68, 68, 0.9)" : "rgba(34, 197, 94, 0.95)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pullLine.x1, pullLine.y1);
        ctx.lineTo(pullLine.x2, pullLine.y2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Pelota
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.fillStyle = "#f5f5dc";
      ctx.beginPath();
      ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    },
    [keeperDiving, pullLine]
  );

  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    if (phase !== "flying" && showCanvas) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx);
    }
  }, [phase, pullLine, draw, showCanvas, heightSel, effectSel]);

  const setCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
    if (!el) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvasScaleRef.current = dpr;
    el.width = CANVAS_W * dpr;
    el.height = CANVAS_H * dpr;
    requestAnimationFrame(() => {
      const ctx = el.getContext("2d");
      if (ctx) drawRef.current(ctx);
    });
  }, []);

  const gameLoop = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;
    const now = performance.now();
    const dt = Math.min((now - g.lastTime) / 1000, 0.03);
    g.lastTime = now;

    const shot = pendingShot;
    if (!shot) return;

    const effectAccel = shot.effect === "izq" ? -2.5 : shot.effect === "der" ? 2.5 : 0;

    g.vx += effectAccel * dt * 60;
    g.vy += GRAVITY * dt * 60;
    g.x += g.vx * dt * 60;
    g.y += g.vy * dt * 60;
    g.vx *= FRICTION_AIR;
    g.vy *= FRICTION_AIR;

    const elapsed = (now - g.shotStartTime) / 1000;
    const hitbox = getKeeperHitbox(keeperDiving, elapsed);

    if (!g.keeperTouchedBall) {
      const touchBody = circleRectCollision(g.x, g.y, BALL_R, hitbox.x, hitbox.y, hitbox.w, hitbox.h);
      const touchHandL = circleCircleCollision(g.x, g.y, BALL_R, hitbox.handL.x, hitbox.handL.y, hitbox.handL.r);
      const touchHandR = circleCircleCollision(g.x, g.y, BALL_R, hitbox.handR.x, hitbox.handR.y, hitbox.handR.r);
      if (touchBody || touchHandL || touchHandR) {
        g.keeperTouchedBall = true;
        haptic("light");
        setLastResult("saved");
        setPhase("saved");
        setAttempts((a) => a + 1);
        setPendingShot(null);
        setKeeperDiving(null);
        g.vx = 0;
        g.vy = 0;
        g.x = BALL_START_X;
        g.y = BALL_START_Y;
        if (g.rafId != null) cancelAnimationFrame(g.rafId);
        g.rafId = null;
        const nextAttempts = attempts + 1;
        if (nextAttempts >= TOTAL_PENALTIES) setPhase("finished");
        else setTimeout(() => setPhase("aim"), 1800);
        draw(ctx);
        return;
      }
    }

    const inGoalX = g.x >= GOAL_LEFT + BALL_R && g.x <= GOAL_LEFT + GOAL_WIDTH - BALL_R;
    const inGoalY = g.y >= GOAL_TOP && g.y <= GOAL_TOP + GOAL_HEIGHT - BALL_R;
    const inGoal = inGoalX && inGoalY;
    const speed = Math.hypot(g.vx, g.vy);

    if (inGoal && speed < 3) {
      haptic("medium");
      setScore((s) => s + 1);
      setLastResult("goal");
      setPhase("scored");
      setAttempts((a) => a + 1);
      setPendingShot(null);
      setKeeperDiving(null);
      g.vx = 0;
      g.vy = 0;
      g.x = BALL_START_X;
      g.y = BALL_START_Y;
      if (g.rafId != null) cancelAnimationFrame(g.rafId);
      g.rafId = null;
      const nextAttempts = attempts + 1;
      if (nextAttempts >= TOTAL_PENALTIES) setPhase("finished");
      else setTimeout(() => setPhase("aim"), 1800);
      draw(ctx);
      return;
    }

    if (g.y > CANVAS_H + BALL_R * 2 || g.x < -BALL_R * 2 || g.x > CANVAS_W + BALL_R * 2 || (g.y > GOAL_TOP + GOAL_HEIGHT + 30 && !inGoalX && speed < 2)) {
      setLastResult("saved");
      setPhase("saved");
      setAttempts((a) => a + 1);
      haptic("light");
      setPendingShot(null);
      setKeeperDiving(null);
      g.vx = 0;
      g.vy = 0;
      g.x = BALL_START_X;
      g.y = BALL_START_Y;
      if (g.rafId != null) cancelAnimationFrame(g.rafId);
      g.rafId = null;
      const nextAttempts = attempts + 1;
      if (nextAttempts >= TOTAL_PENALTIES) setPhase("finished");
      else setTimeout(() => setPhase("aim"), 1800);
      draw(ctx);
      return;
    }

    draw(ctx);
    gameRef.current.rafId = requestAnimationFrame(gameLoop);
  }, [draw, attempts, keeperDiving, pendingShot]);

  useEffect(() => {
    if (phase !== "flying" || !pendingShot) return;
    const heightMult = pendingShot.height === "bajo" ? 0.75 : pendingShot.height === "alto" ? 1.35 : 1;
    const g = gameRef.current;
    g.x = BALL_START_X;
    g.y = BALL_START_Y;
    g.vx = pendingShot.vx;
    g.vy = pendingShot.vy * heightMult;
    g.lastTime = performance.now();
    g.shotStartTime = performance.now();
    g.keeperTouchedBall = false;
    g.rafId = requestAnimationFrame(gameLoop);
    return () => {
      if (g.rafId != null) cancelAnimationFrame(g.rafId);
    };
  }, [phase, pendingShot, gameLoop]);

  const BALL_CLICK_RADIUS = 40;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (stage !== 2 || phase !== "aim" || attempts >= TOTAL_PENALTIES || ballSelected) return;
      const p = getCanvasPoint(e.clientX, e.clientY);
      if (!p) return;
      const g = gameRef.current;
      const dist = Math.hypot(p.x - g.x, p.y - g.y);
      if (dist <= BALL_CLICK_RADIUS) {
        e.preventDefault();
        ballSelectedRef.current = true;
        setBallSelected(true);
        dragEndRef.current = p;
        setPullLine({ x1: g.x, y1: g.y, x2: p.x, y2: p.y });
      }
    },
    [stage, phase, attempts, ballSelected, getCanvasPoint]
  );

  const executeShot = useCallback((shot: ShotParams) => {
    const keeperDir = pickKeeperDirection();
    keeperDiveRef.current = keeperDir;
    setKeeperDiving(keeperDir);
    setPendingShot(shot);
    setPhase("flying");
  }, [pickKeeperDirection]);

  useLayoutEffect(() => {
    if (stage !== 2 || !showCanvas) return;

    const getPoint = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const onMove = (e: PointerEvent) => {
      if (!ballSelectedRef.current) return;
      const p = getPoint(e.clientX, e.clientY);
      if (!p) return;
      dragEndRef.current = p;
      if (pullLineRafRef.current != null) cancelAnimationFrame(pullLineRafRef.current);
      pullLineRafRef.current = requestAnimationFrame(() => {
        const g = gameRef.current;
        const end = dragEndRef.current;
        if (end) setPullLine({ x1: g.x, y1: g.y, x2: end.x, y2: end.y });
        pullLineRafRef.current = null;
      });
    };

    const onUp = (e: PointerEvent) => {
      if (!ballSelectedRef.current) return;
      ballSelectedRef.current = false;
      setBallSelected(false);
      setPullLine(null);
      dragEndRef.current = null;

      const p = getPoint(e.clientX, e.clientY);
      if (!p) return;

      const g = gameRef.current;
      const dx = g.x - p.x;
      const dy = g.y - p.y;
      const len = Math.hypot(dx, dy);

      if (len < MIN_PULL) return;

      haptic("light");

      const pullScale = e.pointerType === "touch" ? PULL_SCALE_MOBILE : PULL_SCALE;
      const speed = Math.min(len * pullScale, MAX_SPEED);
      const vx = (dx / len) * speed;
      const vy = (dy / len) * speed;

      setPendingShot({ vx, vy, height: heightSel, effect: effectSel });
      setPhase("height");
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [stage, showCanvas, heightSel, effectSel]);

  const exitToStage1 = () => {
    if (score > 0 && clientId && name) saveScore(score);
    setStage(1);
    setPhase("aim");
    setPendingShot(null);
  };

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
          Fuerza · Dirección · Altura · Efecto · 5 penales
        </motion.p>

        {stage === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 border-2 border-amber-500/30 text-center">
            <h3 className="font-display text-xl sm:text-2xl text-white mb-6">Iniciar partido</h3>
            <label className="block text-left text-white/80 font-body text-sm mb-2">Nombre del goleador:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && startGame()} placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:border-amber-400/50 mb-6" />
            <motion.button type="button" onClick={startGame} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-8 py-4 rounded-xl font-display text-lg text-white bg-amber-500 border border-amber-400/50 hover:bg-amber-600">
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

            <div ref={containerRef} className="relative mx-auto rounded-xl border-2 border-white/20 overflow-hidden touch-none select-none" style={{ maxWidth: CANVAS_W }}>
              {!showCanvas ? (
                <div className="block bg-[#0d2818]" style={{ width: CANVAS_W, height: CANVAS_H }} />
              ) : (
                <canvas ref={setCanvasRef} className="block w-full h-auto" style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: "100%", touchAction: "none", cursor: "crosshair" }} onPointerDown={handlePointerDown} />
              )}

              {(phase === "finished" || ((phase === "scored" || phase === "saved") && attempts >= TOTAL_PENALTIES)) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/85 rounded-xl">
                  <div className="text-center p-6">
                    <p className="font-display text-2xl text-amber-400 mb-2">Final: {score} goles de {TOTAL_PENALTIES}</p>
                    <motion.button onClick={exitToStage1} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl font-display text-base text-white bg-amber-500 border border-amber-400/50">
                      Guardar y salir
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {(phase === "height" || phase === "effect") && pendingShot && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-black/80 border border-amber-500/30">
                {phase === "height" && (
                  <>
                    <p className="text-white/80 font-body text-sm mb-2">Altura del tiro</p>
                    <div className="flex gap-2 mb-3">
                      {(["bajo", "medio", "alto"] as const).map((h) => (
                        <button key={h} type="button" onClick={() => { setHeightSel(h); setPhase("effect"); }} className={`flex-1 py-2 rounded-lg font-body text-sm ${heightSel === h ? "bg-amber-500 text-white" : "bg-white/20 text-white/80"}`}>
                          {h === "bajo" ? "Bajo" : h === "medio" ? "Medio" : "Alto"}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => { setPendingShot(null); setPhase("aim"); }} className="text-white/60 text-xs hover:text-white/80">
                      Cancelar
                    </button>
                  </>
                )}
                {phase === "effect" && (
                  <>
                    <p className="text-white/80 font-body text-sm mb-2">Efecto</p>
                    <div className="flex gap-2 mb-3">
                      {(["izq", "centro", "der"] as const).map((e) => (
                        <button key={e} type="button" onClick={() => setEffectSel(e)} className={`flex-1 py-2 rounded-lg font-body text-sm ${effectSel === e ? "bg-amber-500 text-white" : "bg-white/20 text-white/80"}`}>
                          {e === "izq" ? "Izq" : e === "centro" ? "Centro" : "Der"}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setPendingShot(null); setPhase("height"); }} className="text-white/60 text-xs hover:text-white/80 py-1">
                        ← Volver
                      </button>
                      <motion.button type="button" onClick={() => pendingShot && executeShot({ ...pendingShot, height: heightSel, effect: effectSel })} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 rounded-xl font-display text-lg text-white bg-green-600 hover:bg-green-500">
                        ⚽ Patear
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {lastResult === "goal" && (
                <motion.div key="goal" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: [0.3, 1.2, 1] }} exit={{ opacity: 0 }} className="text-center mt-4">
                  <p className="font-display text-3xl text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">¡GOOOL! ⚽</p>
                </motion.div>
              )}
              {lastResult === "saved" && (
                <motion.div key="saved" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center mt-4">
                  <p className="font-display text-2xl text-red-400">🧤 Atajada</p>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "aim" && (
              <p className="text-center text-white/50 text-xs font-body mt-3">
                1) Toca la pelota · 2) Arrastra hacia abajo · 3) Elige altura y efecto · 4) Patear
              </p>
            )}

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
