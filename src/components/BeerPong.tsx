"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

const LEADERBOARD_KEY = "alamicos_beerpong_leaderboard";

const TOTAL_CUPS = 6;
const CANVAS_W = 340;
const CANVAS_H = 440;
const TABLE_MARGIN = 20;
const BALL_R = 10;
const CUP_R = 22;
const FRICTION = 0.985;
const PULL_SCALE = 0.10; // 70–90% del arrastre llega al área de vasos; 100% se pasa
const MAX_SPEED = 26;    // máxima potencia: bola se pasa por encima de la cancha (no punto)
const MIN_PULL = 22;     // mínimo: no debe pasar la mitad de cancha

// Mesa: zona jugable (nosotros abajo, vasos arriba)
const TABLE_LEFT = TABLE_MARGIN;
const TABLE_TOP = TABLE_MARGIN;
const TABLE_RIGHT = CANVAS_W - TABLE_MARGIN;
const TABLE_BOTTOM = CANVAS_H - TABLE_MARGIN;

// Pelota: más arriba para tener espacio de arrastre hacia abajo
const BALL_START_X = CANVAS_W / 2;
const BALL_START_Y = CANVAS_H - 100;

// Vasos en triángulo 3-2-1 (vista primera persona: arriba del canvas)
const CUP_ROWS = [
  { count: 3, y: 75 },
  { count: 2, y: 115 },
  { count: 1, y: 155 },
];

function getCupPositions(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const centerX = CANVAS_W / 2;
  const spacing = 36;
  CUP_ROWS.forEach((row) => {
    const startX = centerX - ((row.count - 1) * spacing) / 2;
    for (let i = 0; i < row.count; i++) {
      out.push({ x: startX + i * spacing, y: row.y });
    }
  });
  return out;
}

const CUP_POSITIONS = getCupPositions();

// Con potencia al máximo no se gana punto: solo tiros suaves pueden meter en el vaso
const OVERSPEED_THRESHOLD = MAX_SPEED * 0.55;
// Zona de vasos para rebote entre vasos (y)
const CUP_ZONE_TOP = 50;
const CUP_ZONE_BOTTOM = 175;
const GAP_RADIUS = CUP_R + 22; // distancia "entre" vasos para rebote aleatorio

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

// Haptic feedback (mejora 8): vibración corta en móvil
function haptic(type: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const ms = type === "heavy" ? 30 : type === "medium" ? 20 : 10;
  navigator.vibrate(ms);
}

export default function BeerPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    lastTime: number;
    rafId: number | null;
  }>({
    x: BALL_START_X,
    y: BALL_START_Y,
    vx: 0,
    vy: 0,
    lastTime: 0,
    rafId: null,
  });
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const pullLineRafRef = useRef<number | null>(null);
  const cupsHitRef = useRef<number[]>([]);
  const currentPlayerIdRef = useRef<string | null>(null);
  const participantsRef = useRef<Participant[]>([]);
  const ballSelectedRef = useRef(false);
  const bouncedBetweenCupsRef = useRef(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [cupsHit, setCupsHit] = useState<number[]>([]);
  const [lives, setLives] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [ballSelected, setBallSelected] = useState(false);
  const [pullLine, setPullLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [lastResult, setLastResult] = useState<"hit" | "miss" | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [stage, setStage] = useState<1 | 2>(1);
  const [mounted, setMounted] = useState(false);
  const [celebratingHit, setCelebratingHit] = useState<number | null>(null);
  const celebratingHitAtRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasScaleRef = useRef(1);
  const [canvasDpr, setCanvasDpr] = useState(1);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const remainingCups = TOTAL_CUPS - cupsHit.length;

  // Evitar hidratación: el canvas y la etapa 2 solo existen en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Al acertar todos los vasos: mostrar modal de victoria (no dejar la partida parada)
  useEffect(() => {
    if (remainingCups === 0 && cupsHit.length === TOTAL_CUPS && !gameOver) {
      setShowWinModal(true);
    }
  }, [remainingCups, cupsHit.length, gameOver]);

  useEffect(() => {
    cupsHitRef.current = cupsHit;
    currentPlayerIdRef.current = currentPlayerId;
    participantsRef.current = participants;
    ballSelectedRef.current = ballSelected;
  }, [cupsHit, currentPlayerId, participants, ballSelected]);

  // Mejora 10: cargar leaderboard solo en useEffect (nunca en render) para evitar hidratación
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = loadLeaderboard();
    const namesToRemove = ["Prueba", "PRUEBA", "AGUANTE LA UC", "ALAMOS"];
    let loaded = raw.filter((p) => !namesToRemove.includes(p.name));
    if (loaded.length < raw.length) saveLeaderboard(loaded);
    setParticipants(loaded);
    if (loaded.length > 0) {
      setCurrentPlayerId((id) => id || loaded[0].id);
    }
  }, []);

  // Cargar logo Alamicos para dibujarlo dentro del tablero verde
  useEffect(() => {
    if (typeof window === "undefined") return;
    const img = new Image();
    img.src = "/logo-alamicos.png";
    img.onload = () => {
      logoImgRef.current = img;
      setLogoLoaded(true);
    };
    return () => {
      logoImgRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (participants.length > 0) saveLeaderboard(participants);
  }, [participants]);

  // Al perder (game over), guardar puntaje y posición en la tabla
  useEffect(() => {
    if (gameOver && participants.length > 0) saveLeaderboard(participants);
  }, [gameOver, participants]);

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
    setCurrentPlayerId(id);
    setNewName("");
  }, [newName, participants]);

  // Pasar a etapa 2: registrar jugador (si hace falta), reiniciar partida y mostrar cancha
  const startGame = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    const existing = participants.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setCurrentPlayerId(existing.id);
    } else {
      const id = generateId();
      setParticipants((prev) => [...prev, { id, name, score: 0 }]);
      setCurrentPlayerId(id);
    }
    setNewName("");
    setStage(2);
    setLives(2);
    setCupsHit([]);
    cupsHitRef.current = [];
    setGameOver(false);
    setShowWinModal(false);
    setLastResult(null);
    const g = gameRef.current;
    g.x = BALL_START_X;
    g.y = BALL_START_Y;
    g.vx = 0;
    g.vy = 0;
  }, [newName, participants]);

  // Salir: volver a etapa 1 (solo sobre la cancha)
  const exitToStage1 = useCallback(() => {
    setStage(1);
    setShowWinModal(false);
    setGameOver(false);
  }, []);

  // Coordenadas lógicas (0..CANVAS_W, 0..CANVAS_H) para coincidir con el dibujo escalado
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

      ctx.fillStyle = "#0d1b24";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Mesa (verde tipo cancha de fútbol)
      ctx.fillStyle = "#1b5e3f";
      ctx.beginPath();
      ctx.roundRect(TABLE_LEFT, TABLE_TOP, TABLE_RIGHT - TABLE_LEFT, TABLE_BOTTOM - TABLE_TOP, 8);
      ctx.fill();

      // Centro de la cancha: una línea horizontal y un círculo (nada más)
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2.5;
      const tableW = TABLE_RIGHT - TABLE_LEFT;
      const tableH = TABLE_BOTTOM - TABLE_TOP;
      const centerX = TABLE_LEFT + tableW / 2;
      const centerY = TABLE_TOP + tableH / 2;

      // Línea de saque (horizontal, al medio)
      ctx.beginPath();
      ctx.moveTo(TABLE_LEFT, centerY);
      ctx.lineTo(TABLE_RIGHT, centerY);
      ctx.stroke();

      // Círculo central
      ctx.beginPath();
      ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
      ctx.stroke();

      // Borde mesa (blanco)
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(TABLE_LEFT, TABLE_TOP, tableW, tableH, 8);
      ctx.stroke();

      // Logo Alamicos fijo dentro del rectángulo verde: abajo de los vasos, arriba del centro, 60% opacidad
      const logoImg = logoImgRef.current;
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const logoW = 100;
        const logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW;
        const logoX = centerX - logoW / 2;
        const logoY = 155 + CUP_R * 2 + (centerY - (155 + CUP_R * 2)) / 2 - logoH / 2;
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
        ctx.restore();
      }

      // Vasos (mejora 3: animación al meter — escala + "+1")
      const now = typeof performance !== "undefined" ? performance.now() : 0;
      const celebrating = celebratingHit !== null ? { i: celebratingHit, at: celebratingHitAtRef.current } : null;
      const celebrateElapsed = celebrating ? (now - celebrating.at) / 400 : 1;
      const celebrateScale = celebrating ? 1 + 0.35 * Math.max(0, 1 - celebrateElapsed) : 1;
      CUP_POSITIONS.forEach((pos, i) => {
        if (cupsHitRef.current.includes(i) && i !== celebratingHit) return;
        const scale = i === celebratingHit ? celebrateScale : 1;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.scale(scale, scale);
        ctx.translate(-pos.x, -pos.y);
        ctx.fillStyle = "#8b0000";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, CUP_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#b22222";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🍺", pos.x, pos.y);
        if (i === celebratingHit && celebrateElapsed < 1) {
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 18px sans-serif";
          ctx.fillText("+1", pos.x, pos.y - CUP_R - 12);
        }
        ctx.restore();
      });

      // Línea de “tirar para atrás” (desde la bola hasta el dedo)
      if (pullLine) {
        const dx = pullLine.x2 - pullLine.x1;
        const dy = pullLine.y2 - pullLine.y1;
        const len = Math.hypot(dx, dy);
        const speed = Math.min(len * PULL_SCALE, MAX_SPEED);
        const isInRange = speed < OVERSPEED_THRESHOLD;
        ctx.strokeStyle = isInRange ? "rgba(255, 215, 0, 0.95)" : "rgba(255, 100, 100, 0.95)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pullLine.x1, pullLine.y1);
        ctx.lineTo(pullLine.x2, pullLine.y2);
        ctx.stroke();
        ctx.setLineDash([]);
        if (len > 15) {
          const ax = pullLine.x2 - (dx / len) * 14;
          const ay = pullLine.y2 - (dy / len) * 14;
          const perp = 6;
          const px = (-dy / len) * perp;
          const py = (dx / len) * perp;
          ctx.beginPath();
          ctx.moveTo(pullLine.x2, pullLine.y2);
          ctx.lineTo(ax + px, ay + py);
          ctx.lineTo(ax - px, ay - py);
          ctx.closePath();
          ctx.fillStyle = isInRange ? "rgba(255, 215, 0, 0.9)" : "rgba(255, 100, 100, 0.9)";
          ctx.fill();
          ctx.stroke();
        }
        const barY = CANVAS_H - 28;
        const barW = CANVAS_W - 40;
        const barX = 20;
        const barH = 10;
        const thresholdRatio = OVERSPEED_THRESHOLD / MAX_SPEED;
        ctx.fillStyle = "rgba(34, 197, 94, 0.6)";
        ctx.fillRect(barX, barY, barW * thresholdRatio, barH);
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.fillRect(barX + barW * thresholdRatio, barY, barW * (1 - thresholdRatio), barH);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        const markerX = barX + (speed / MAX_SPEED) * barW;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(markerX, barY + barH / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Pelota
      ctx.fillStyle = "#f5f5dc";
      ctx.beginPath();
      ctx.arc(g.x, g.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#c4a035";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [pullLine, celebratingHit, logoLoaded]
  );

  const gameLoop = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;
    const now = performance.now();
    const dt = Math.min((now - g.lastTime) / 1000, 0.05);
    g.lastTime = now;

    g.x += g.vx * dt * 60;
    g.y += g.vy * dt * 60;
    g.vx *= FRICTION;
    g.vy *= FRICTION;

    const speed = Math.hypot(g.vx, g.vy);

    // Cuando la bola se detiene: reiniciar a posición inicial para el siguiente lanzamiento
    if (speed < 0.2) {
      bouncedBetweenCupsRef.current = false;
      g.vx = 0;
      g.vy = 0;
      g.x = BALL_START_X;
      g.y = BALL_START_Y;
      setIsFlying(false);
      if (g.rafId != null) cancelAnimationFrame(g.rafId);
      g.rafId = null;
      draw(ctx);
      return;
    }

    const curCups = cupsHitRef.current;
    const curPlayer = currentPlayerIdRef.current;

    // Gol en vaso: solo cuenta si la bola no va con exceso de fuerza (>90% → pasa por encima, no punto)
    for (let i = 0; i < TOTAL_CUPS; i++) {
      if (curCups.includes(i)) continue;
      const c = CUP_POSITIONS[i];
      const dist = Math.hypot(g.x - c.x, g.y - c.y);
      if (dist < CUP_R) {
        if (speed >= OVERSPEED_THRESHOLD) {
          break;
        }
        bouncedBetweenCupsRef.current = false;
        celebratingHitAtRef.current = now;
        setCelebratingHit(i);
        haptic("medium");
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
        g.x = BALL_START_X;
        g.y = BALL_START_Y;
        g.vx = 0;
        g.vy = 0;
        setIsFlying(false);
        if (g.rafId != null) cancelAnimationFrame(g.rafId);
        g.rafId = null;
        draw(ctx);
        return;
      }
    }

    // Bola entre dos vasos (no dentro de ninguno): rebote aleatorio como en la vida real
    const inCupZone = g.y >= CUP_ZONE_TOP && g.y <= CUP_ZONE_BOTTOM;
    if (inCupZone && speed < 6 && !bouncedBetweenCupsRef.current) {
      let minDistToCup = Infinity;
      for (let i = 0; i < TOTAL_CUPS; i++) {
        if (curCups.includes(i)) continue;
        const d = Math.hypot(g.x - CUP_POSITIONS[i].x, g.y - CUP_POSITIONS[i].y);
        if (d < CUP_R) {
          minDistToCup = 0;
          break;
        }
        if (d < minDistToCup) minDistToCup = d;
      }
      if (minDistToCup > CUP_R && minDistToCup < GAP_RADIUS) {
        bouncedBetweenCupsRef.current = true;
        g.vx = (Math.random() - 0.5) * 10;
        g.vy = (Math.random() - 0.3) * 8;
      }
    }

    if (
      g.x < TABLE_LEFT - BALL_R ||
      g.x > TABLE_RIGHT + BALL_R ||
      g.y < TABLE_TOP - BALL_R ||
      g.y > TABLE_BOTTOM + BALL_R
    ) {
      bouncedBetweenCupsRef.current = false;
      setLastResult("miss");
      setLives((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          haptic("heavy");
          setGameOver(true);
        }
        return next;
      });
      g.x = BALL_START_X;
      g.y = BALL_START_Y;
      g.vx = 0;
      g.vy = 0;
      setIsFlying(false);
      if (g.rafId != null) cancelAnimationFrame(g.rafId);
      g.rafId = null;
      draw(ctx);
      return;
    }

    draw(ctx);
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

  // Zona de click más grande para que sea fácil tocar la bola (radio 35px)
  const BALL_CLICK_RADIUS = 35;

  // Solo se activa si haces click EN la bola blanca
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (stage !== 2 || participants.length === 0 || isFlying || gameOver || remainingCups <= 0 || ballSelected) return;
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
    [stage, participants.length, isFlying, gameOver, remainingCups, ballSelected, getCanvasPoint]
  );

  // Listeners globales para arrastrar y soltar: solo en etapa 2 cuando el canvas existe (useLayoutEffect para que el ref ya esté asignado)
  useLayoutEffect(() => {
    if (stage !== 2) return;
    const el = canvasRef.current;
    if (!el) return;

    const getPoint = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
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
      const speed = Math.min(len * PULL_SCALE, MAX_SPEED);
      const vx = (dx / len) * speed;
      const vy = (dy / len) * speed;

      g.x = BALL_START_X;
      g.y = BALL_START_Y;
      g.vx = vx;
      g.vy = vy;

      bouncedBetweenCupsRef.current = false;
      setLastResult(null);
      setIsFlying(true);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [stage]);

  // Reiniciar tras Game Over: nuevo intento en la tabla (mismo nombre, puntaje 0, "intento 2", "3"...)
  const startNewGame = useCallback(() => {
    const currentPlayer = participants.find((p) => p.id === currentPlayerId);
    if (currentPlayer) {
      const newParticipant: Participant = {
        id: generateId(),
        name: currentPlayer.name,
        score: 0,
      };
      setParticipants((prev) => [...prev, newParticipant]);
      setCurrentPlayerId(newParticipant.id);
    }
    setGameOver(false);
    setShowWinModal(false);
    setLives(2);
    setCupsHit([]);
    cupsHitRef.current = [];
    setLastResult(null);
    const g = gameRef.current;
    g.x = BALL_START_X;
    g.y = BALL_START_Y;
    g.vx = 0;
    g.vy = 0;
  }, [participants, currentPlayerId]);

  // Doblar la apuesta: nueva ronda (6 vasos), se mantienen vidas, jugadores y puntajes
  const startNewRound = useCallback(() => {
    setShowWinModal(false);
    setCupsHit([]);
    cupsHitRef.current = [];
    setLastResult(null);
    setIsFlying(false);
    const g = gameRef.current;
    g.x = BALL_START_X;
    g.y = BALL_START_Y;
    g.vx = 0;
    g.vy = 0;
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx);
  }, [draw, cupsHit, lives]);

  // Mejora 7: canvas responsive con devicePixelRatio (solo en cliente)
  useEffect(() => {
    if (stage !== 2 || typeof window === "undefined") return;
    const dpr = window.devicePixelRatio || 1;
    canvasScaleRef.current = dpr;
    setCanvasDpr(dpr);
  }, [stage]);

  // Al pasar a etapa 2, forzar redibujado del canvas
  useEffect(() => {
    if (stage !== 2) return;
    const raf = requestAnimationFrame(() => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx);
    });
    return () => cancelAnimationFrame(raf);
  }, [stage, draw]);

  // Mejora 3: animación "+1" al meter vaso — redibujar durante 400ms y luego limpiar
  useEffect(() => {
    if (celebratingHit === null) return;
    const start = celebratingHitAtRef.current;
    let rafId: number;
    const tick = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx);
      if (typeof performance !== "undefined" && performance.now() - start < 400) {
        rafId = requestAnimationFrame(tick);
      } else {
        setCelebratingHit(null);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [celebratingHit, draw]);

  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  // Para mostrar "(intento 2)", "(intento 3)" cuando el mismo nombre se repite en la tabla
  const getDisplayName = (name: string, index: number) => {
    const sameNameCount = sortedParticipants
      .slice(0, index + 1)
      .filter((p) => p.name === name).length;
    return sameNameCount > 1 ? `${name} (intento ${sameNameCount})` : name;
  };
  const getDisplayNameInList = (p: Participant, index: number) => {
    const sameNameCount = participants
      .slice(0, index + 1)
      .filter((x) => x.name === p.name).length;
    return sameNameCount > 1 ? `${p.name} (intento ${sameNameCount})` : p.name;
  };

  const currentScore = currentPlayerId
    ? participants.find((p) => p.id === currentPlayerId)?.score ?? 0
    : 0;
  const currentRank =
    sortedParticipants.findIndex((p) => p.id === currentPlayerId) + 1 || 0;

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
          Desliza el dedo hacia los vasos para lanzar
        </motion.p>

        {/* Etapa 1: Iniciar juego — Nombre + Jugar (sin tabla) */}
        {stage === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 border-2 border-amber-500/30 text-center"
          >
            <h3 className="font-display text-xl sm:text-2xl text-white mb-6">
              Iniciar juego
            </h3>
            <label className="block text-left text-white/80 font-body text-sm mb-2">
              Nombre:
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startGame()}
              placeholder="Usuario completa nombre"
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
            <p className="text-white/60 font-body text-sm mt-6 text-center max-w-sm mx-auto">
              Arrastra desde la bola hacia atrás y suelta para lanzar. 2 vidas, 6 vasos.
            </p>
          </motion.div>
        )}

        {/* Etapa 2: Cancha + tabla abajo; modal solo sobre la cancha al ganar/perder. Solo en cliente para evitar hidratación. */}
        {stage === 2 && mounted && (
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-red-500/30 shadow-[0_0_40px_rgba(220,38,38,0.15)]"
        >
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="font-mono text-white/70 text-sm">
                Vasos: {remainingCups}/{TOTAL_CUPS}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2].map((i) => (
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

          <>
            {/* Cancha: canvas y modal solo sobre ella cuando gana/pierde */}
            <div
              ref={containerRef}
              key="game-board"
              className="relative mx-auto rounded-xl border-2 border-amber-500/40 overflow-hidden touch-none select-none"
              style={{ maxWidth: "100%" }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_W * canvasDpr}
                height={CANVAS_H * canvasDpr}
                className="block w-full h-auto"
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  maxWidth: "100%",
                  touchAction: "none",
                  cursor: "crosshair",
                }}
                onPointerDown={handlePointerDown}
              />
              {(showWinModal || gameOver) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/85 rounded-xl p-6">
                  <div className="text-center">
                    {showWinModal ? (
                      <>
                        <p className="font-display text-2xl text-amber-400 mb-2">¡GANASTE!</p>
                        <p className="font-body text-white/80 text-sm mb-6">¿Seguir jugando?</p>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-2xl text-red-400 mb-2">GAME OVER</p>
                        <p className="font-body text-white/80 text-sm mb-1">
                          Puntaje: <span className="font-bold text-amber-400">{currentScore}</span>
                        </p>
                        <p className="font-body text-white/70 text-xs mb-6">
                          Puesto {currentRank}º en la tabla
                        </p>
                      </>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <motion.button
                        onClick={showWinModal ? startNewRound : startNewGame}
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
            </div>

            <p className="text-center text-white/50 text-xs font-body mt-3">
              1) Click en la bola blanca · 2) Arrastra para atrás (hacia ti) en cualquier parte · 3) Suelta para lanzar
            </p>

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
          </>
        </motion.div>
        )}

        {/* Tabla de puntajes debajo del tablero (etapa 2) */}
        {stage === 2 && mounted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 mt-6 border border-white/20"
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
                        {getDisplayName(p.name, idx)}
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
          </motion.div>
        )}
      </div>
    </section>
  );
}
