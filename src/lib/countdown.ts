// Inicio de la despedida: Viernes 20 febrero 2026, 12:00 Santiago de Chile
export const TARGET = new Date("2026-02-20T12:00:00-03:00");

export function getDaysLeft(): number {
  const now = new Date();
  const diff = TARGET.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
