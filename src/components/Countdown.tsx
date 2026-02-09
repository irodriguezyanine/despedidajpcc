"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TARGET } from "@/lib/countdown";

function getTimeLeft() {
  const now = new Date();
  const diff = TARGET.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    done: false,
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function DigitColumn({ value, label }: { value: number; label: string }) {
  const top = pad(value);
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-2">
      <div className="relative h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 overflow-hidden rounded-lg bg-black/60 border border-miami-blue/40 font-mono text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-miami-blue text-neon-cyan flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={top}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="tabular-nums"
          >
            {top}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/70 font-body">
        {label}
      </span>
    </div>
  );
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, []);

  if (timeLeft.done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-display text-3xl sm:text-5xl md:text-6xl text-sunset-orange text-neon-orange"
      >
        ¡EMPECEMOS!
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-wrap justify-center gap-3 sm:gap-6 md:gap-8"
    >
      <DigitColumn value={timeLeft.days} label="Días" />
      <DigitColumn value={timeLeft.hours} label="Horas" />
      <DigitColumn value={timeLeft.minutes} label="Min" />
      <DigitColumn value={timeLeft.seconds} label="Seg" />
    </motion.div>
  );
}
