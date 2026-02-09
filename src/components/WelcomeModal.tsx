"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDaysLeft } from "@/lib/countdown";

const STORAGE_KEY = "welcomeEntered";

export function hasUserEntered(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "true";
}

export function markUserEntered(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, "true");
  window.dispatchEvent(new CustomEvent("welcomeEnter"));
}

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    if (hasUserEntered()) return;
    setVisible(true);
    setDays(getDaysLeft());
  }, []);

  const handleEnter = () => {
    markUserEntered();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl rounded-3xl p-10 sm:p-14 text-center border border-white/10 shadow-2xl"
            style={{ backgroundColor: "#0c4a6e" }}
          >
            <img
              src="/logo-alamicos.png"
              alt="ALAMICOS R.F.C"
              className="mx-auto mb-6 w-32 h-32 sm:w-40 sm:h-40 object-contain"
            />
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white leading-tight mb-4">
              BIENVENIDOS A UNA DESPEDIDA MÁS DE ALAMICOS R.F.C
            </h2>
            <p className="font-body text-lg text-white/90 mb-4">
              Se nos casa nuestro querido goleador
            </p>
            <p className="font-body text-lg sm:text-xl md:text-2xl text-white leading-relaxed mb-10">
              QUEDAN <span className="font-bold text-amber-300">{days}</span> DÍAS PARA UNA ÚLTIMA VUELTA !
            </p>
            <motion.button
              onClick={handleEnter}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-12 py-4 rounded-xl font-display text-xl tracking-wider text-white shadow-lg transition-colors hover:opacity-90 bg-teal-500"
            >
              ENTRAR
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
