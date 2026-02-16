"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, Trophy, Crown, ChevronRight, X } from "lucide-react";
import { SQUAD_MEMBERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "alamicos_encuesta_votos";
const API_VOTES = "/api/encuesta/votes";

interface VoteRecord {
  email: string;
  name: string;
  mvp: string;
  masPerra: string;
  timestamp: number;
}

interface StoredData {
  votes: VoteRecord[];
}

function loadVotesLocal(): VoteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: StoredData = JSON.parse(raw);
    return Array.isArray(parsed?.votes) ? parsed.votes : [];
  } catch {
    return [];
  }
}

function saveVotesLocal(votes: VoteRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ votes }));
  } catch {}
}

async function fetchVotes(): Promise<{ data: VoteRecord[]; useLocalStorage?: boolean }> {
  try {
    const res = await fetch(API_VOTES);
    const json = await res.json();
    // Si la API falla (500, tabla no existe, etc.), usar localStorage
    if (!res.ok || json?.error) {
      return { data: loadVotesLocal(), useLocalStorage: true };
    }
    return {
      data: Array.isArray(json?.data) ? json.data : [],
      useLocalStorage: json?.useLocalStorage,
    };
  } catch {
    return { data: loadVotesLocal(), useLocalStorage: true };
  }
}

async function saveVoteToServer(vote: VoteRecord): Promise<VoteRecord[] | null> {
  try {
    const res = await fetch(API_VOTES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: vote.email,
        name: vote.name,
        mvp: vote.mvp,
        masPerra: vote.masPerra,
      }),
    });
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : null;
  } catch {
    return null;
  }
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function VotingSection() {
  const [stage, setStage] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mvpVote, setMvpVote] = useState<string | null>(null);
  const [masPerraVote, setMasPerraVote] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [selectedBar, setSelectedBar] = useState<{ category: "mvp" | "masPerra"; option: string } | null>(null);

  const [useLocalStorageOnly, setUseLocalStorageOnly] = useState(true);

  const refreshVotes = useCallback(async () => {
    const { data, useLocalStorage } = await fetchVotes();
    setUseLocalStorageOnly(!!useLocalStorage);
    setVotes(Array.isArray(data) ? data : loadVotesLocal());
  }, []);

  useEffect(() => {
    refreshVotes();
  }, [refreshVotes, stage]);

  const handleRegister = () => {
    setError("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Ingresa tu nombre");
      return;
    }
    if (!trimmedEmail) {
      setError("Ingresa tu correo");
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError("Correo inválido");
      return;
    }
    // Permitir cambiar el voto: si ya votó, puede continuar para reemplazar su voto
    setStage(2);
  };

  const handleMvpVote = (id: string) => {
    setMvpVote(id);
  };

  const handleMasPerraVote = (id: string) => {
    setMasPerraVote(id);
  };

  const confirmMvp = () => {
    if (!mvpVote) {
      setError("Selecciona al MVP");
      return;
    }
    setError("");
    setStage(3);
  };

  const confirmMasPerra = async () => {
    if (!masPerraVote) {
      setError("Selecciona una opción");
      return;
    }
    setError("");

    const newVote: VoteRecord = {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      mvp: mvpVote!,
      masPerra: masPerraVote!,
      timestamp: Date.now(),
    };

    if (useLocalStorageOnly) {
      const trimmedEmail = email.trim().toLowerCase();
      const existingVotes = loadVotesLocal();
      const updated = existingVotes
        .filter((v) => v.email !== trimmedEmail)
        .concat(newVote);
      saveVotesLocal(updated);
      setVotes(updated);
    } else {
      const updated = await saveVoteToServer(newVote);
      if (updated) {
        setVotes(updated);
      } else {
        // API falló: guardar en localStorage y mostrar
        setUseLocalStorageOnly(true);
        const fallback = loadVotesLocal()
          .filter((v) => v.email !== newVote.email)
          .concat(newVote);
        saveVotesLocal(fallback);
        setVotes(fallback);
      }
    }
    setStage(4);
  };

  const computeResults = (category: "mvp" | "masPerra") => {
    const counts: Record<string, number> = {};
    const voters: Record<string, string[]> = {};

    SQUAD_MEMBERS.forEach((m) => {
      counts[m.id] = 0;
      voters[m.id] = [];
    });

    votes.forEach((v) => {
      const key = v[category];
      if (key && counts[key] !== undefined) {
        counts[key]++;
        voters[key].push(v.name);
      }
    });

    return Object.entries(counts)
      .map(([id, count]) => ({
        id,
        apodo: SQUAD_MEMBERS.find((m) => m.id === id)?.apodo ?? id,
        count,
        voters: voters[id] ?? [],
      }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  };

  const mvpResults = computeResults("mvp");
  const masPerraResults = computeResults("masPerra");
  const maxMvp = Math.max(1, ...mvpResults.map((r) => r.count));
  const maxMasPerra = Math.max(1, ...masPerraResults.map((r) => r.count));

  const openBarModal = (category: "mvp" | "masPerra", option: string) => {
    setSelectedBar({ category, option });
  };

  return (
    <section id="encuesta" className="relative py-24 px-4 overflow-hidden stripes-football">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/90 via-red-950/40 to-sky-950/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/5 via-transparent to-miami-blue/5" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(255,255,255,0.2) 24px, rgba(255,255,255,0.2) 26px)`,
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <Vote className="w-8 h-8 text-amber-400" />
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white">
            ENCUESTA <span className="text-amber-400">ALAMICOS</span>
          </h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/60 font-body text-sm mb-8"
        >
          Vota y descubre los resultados
        </motion.p>

        <AnimatePresence mode="wait">
          {/* Etapa 1: Registro */}
          {stage === 1 && (
            <motion.div
              key="stage1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl p-8 border-2 border-amber-500/30 shadow-[0_0_40px_rgba(251,191,36,0.1)]"
            >
              <h3 className="font-display text-xl sm:text-2xl text-white mb-2 text-center">
                Vota en la encuesta
              </h3>
              <p className="text-white/60 text-sm font-body text-center mb-6">
                Registra tu nombre y correo. Si ya votaste, puedes cambiar tu voto.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 font-body text-sm mb-2">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/80 font-body text-sm mb-2">Correo</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                    placeholder="tu@correo.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 transition-all"
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-red-400 text-sm font-body"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="button"
                onClick={handleRegister}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full py-4 rounded-xl font-display text-lg text-white bg-amber-500 border border-amber-400/50 hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                Continuar
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              {votes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStage(4);
                  }}
                  className="mt-4 w-full py-2 text-white/60 hover:text-white font-body text-sm transition-colors"
                >
                  Ver resultados sin votar
                </button>
              )}
            </motion.div>
          )}

          {/* Etapa 2: MVP */}
          {stage === 2 && (
            <motion.div
              key="stage2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl p-8 border-2 border-amber-500/30 shadow-[0_0_40px_rgba(251,191,36,0.1)]"
            >
              <div className="flex items-center gap-2 justify-center mb-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h3 className="font-display text-xl sm:text-2xl text-white">
                  ¿Quién será el MVP?
                </h3>
              </div>
              <p className="text-white/60 text-sm font-body text-center mb-6">
                Elige al jugador más valioso
              </p>

              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
              >
                {SQUAD_MEMBERS.map((member) => (
                  <motion.button
                    key={member.id}
                    variants={item}
                    type="button"
                    onClick={() => handleMvpVote(member.id)}
                    className={cn(
                      "py-3 px-4 rounded-xl font-body text-sm transition-all duration-200",
                      "border-2",
                      mvpVote === member.id
                        ? "bg-amber-500/30 border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                        : "bg-white/5 border-white/20 text-white/90 hover:border-amber-400/40 hover:bg-white/10"
                    )}
                  >
                    {member.apodo}
                  </motion.button>
                ))}
              </motion.div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-red-400 text-sm font-body text-center"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="button"
                onClick={confirmMvp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full py-4 rounded-xl font-display text-lg text-white bg-amber-500 border border-amber-400/50 hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Etapa 3: Más perra */}
          {stage === 3 && (
            <motion.div
              key="stage3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl p-8 border-2 border-neon-pink/30 shadow-[0_0_40px_rgba(255,0,255,0.1)]"
            >
              <div className="flex items-center gap-2 justify-center mb-2">
                <Crown className="w-6 h-6 text-neon-pink" />
                <h3 className="font-display text-xl sm:text-2xl text-white">
                  ¿Quién será la perrita?
                </h3>
              </div>
              <p className="text-white/60 text-sm font-body text-center mb-6">
                Tu voto secreto
              </p>

              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
              >
                {SQUAD_MEMBERS.map((member) => (
                  <motion.button
                    key={member.id}
                    variants={item}
                    type="button"
                    onClick={() => handleMasPerraVote(member.id)}
                    className={cn(
                      "py-3 px-4 rounded-xl font-body text-sm transition-all duration-200",
                      "border-2",
                      masPerraVote === member.id
                        ? "bg-neon-pink/30 border-neon-pink text-pink-100 shadow-[0_0_20px_rgba(255,0,255,0.2)]"
                        : "bg-white/5 border-white/20 text-white/90 hover:border-neon-pink/40 hover:bg-white/10"
                    )}
                  >
                    {member.apodo}
                  </motion.button>
                ))}
              </motion.div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-red-400 text-sm font-body text-center"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="button"
                onClick={confirmMasPerra}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full py-4 rounded-xl font-display text-lg text-white bg-neon-pink/80 border border-neon-pink/50 hover:bg-neon-pink shadow-lg shadow-neon-pink/20 transition-all flex items-center justify-center gap-2"
              >
                Enviar votación
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Etapa 4: Resultados */}
          {stage === 4 && (
            <motion.div
              key="stage4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                {name ? (
                  <>
                    <h3 className="font-display text-2xl text-amber-400 mb-1">¡Gracias por votar!</h3>
                    <p className="text-white/60 font-body text-sm">
                      {name}, tu voto ha sido registrado correctamente
                    </p>
                  </>
                ) : (
                  <h3 className="font-display text-2xl text-amber-400 mb-1">Resultados de la encuesta</h3>
                )}
              </motion.div>

              {/* MVP Results */}
              <div className="glass-card rounded-2xl p-6 border border-amber-500/20">
                <h4 className="font-display text-lg text-amber-400 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  ¿Quién será el MVP?
                </h4>
                <div className="space-y-4">
                  {mvpResults.length === 0 ? (
                    <p className="text-white/50 text-sm">Aún no hay votos</p>
                  ) : (
                    mvpResults.map((r, i) => (
                      <BarRow
                        key={r.id}
                        label={r.apodo}
                        count={r.count}
                        max={maxMvp}
                        voters={r.voters}
                        color="amber"
                        onClick={() => openBarModal("mvp", r.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Más perra Results */}
              <div className="glass-card rounded-2xl p-6 border border-neon-pink/20">
                <h4 className="font-display text-lg text-neon-pink mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  ¿Quién será la perrita?
                </h4>
                <div className="space-y-4">
                  {masPerraResults.length === 0 ? (
                    <p className="text-white/50 text-sm">Aún no hay votos</p>
                  ) : (
                    masPerraResults.map((r) => (
                      <BarRow
                        key={r.id}
                        label={r.apodo}
                        count={r.count}
                        max={maxMasPerra}
                        voters={r.voters}
                        color="pink"
                        onClick={() => openBarModal("masPerra", r.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {name && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      setStage(2);
                      setMvpVote(null);
                      setMasPerraVote(null);
                      setError("");
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl font-body text-sm text-amber-400 bg-amber-500/20 border border-amber-400/30 hover:bg-amber-500/30 transition-all"
                  >
                    Cambiar mi voto
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  onClick={() => {
                    setStage(1);
                    setName("");
                    setEmail("");
                    setMvpVote(null);
                    setMasPerraVote(null);
                    setError("");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-body text-sm text-white/80 bg-white/10 border border-white/20 hover:bg-white/15 hover:text-white transition-all"
                >
                  {name ? "Volver a la encuesta" : "Nueva votación"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de detalle de votos */}
      <AnimatePresence>
        {selectedBar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedBar(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 max-w-md w-full border-2 border-amber-500/40 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-display text-lg text-white">
                  Votos para{" "}
                  <span className="text-amber-400">
                    {SQUAD_MEMBERS.find((m) => m.id === selectedBar.option)?.apodo ?? selectedBar.option}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedBar(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(() => {
                  const votersList = votes
                    .filter((v) => v[selectedBar!.category] === selectedBar!.option)
                    .map((v) => v.name);
                  return votersList.length === 0 ? (
                    <p className="text-white/50 text-sm">Sin votos</p>
                  ) : (
                    votersList.map((voter, i) => (
                      <div
                        key={i}
                        className="py-2 px-3 rounded-lg bg-white/5 text-white/90 font-body text-sm"
                      >
                        {voter}
                      </div>
                    ))
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function BarRow({
  label,
  count,
  max,
  voters,
  color,
  onClick,
}: {
  label: string;
  count: number;
  max: number;
  voters: string[];
  color: "amber" | "pink";
  onClick: () => void;
}) {
  const pct = (count / max) * 100;
  const barColor =
    color === "amber"
      ? "bg-gradient-to-r from-amber-500 to-amber-400"
      : "bg-gradient-to-r from-neon-pink to-pink-400";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="group cursor-pointer rounded-lg p-2 -m-2 hover:bg-white/5 transition-colors"
      title="Haz clic para ver quién votó"
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-body text-sm font-medium text-white">{label}</span>
        <span className="font-mono text-sm text-white/70">
          {count} {count === 1 ? "voto" : "votos"}
        </span>
      </div>
      <div className="h-8 rounded-lg bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-lg", barColor)}
          title={voters.join(", ")}
        />
      </div>
    </div>
  );
}
