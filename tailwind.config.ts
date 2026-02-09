import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "neon-pink": "#ff00ff",
        "sunset-orange": "#ff9900",
        "deep-purple": "#2d004d",
        "miami-blue": "#00ffff",
        background: "#0a0612",
        foreground: "#fafafa",
      },
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        body: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      animation: {
        "glitch": "glitch 0.3s ease-in-out infinite",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
      },
      keyframes: {
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(2px, -2px)" },
          "60%": { transform: "translate(-2px, -2px)" },
          "80%": { transform: "translate(2px, 2px)" },
        },
        "pulse-neon": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.9", filter: "brightness(1.2)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-sunset": "linear-gradient(135deg, #2d004d 0%, #ff9900 50%, #ff00ff 100%)",
      },
      boxShadow: {
        "neon-pink": "0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.3)",
        "neon-cyan": "0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.3)",
        "neon-orange": "0 0 20px rgba(255, 153, 0, 0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
