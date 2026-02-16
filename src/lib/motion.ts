// Configuración para animaciones fluidas en toda la página
// amount: 0.15 = animar cuando 15% del elemento es visible
// margin: "50px" = empezar a detectar 50px antes de que entre en vista
export const viewportSmooth = {
  once: true,
  amount: 0.15,
  margin: "50px",
} as const;

export const transitionSmooth = {
  duration: 0.4,
  ease: "easeOut" as const,
};
