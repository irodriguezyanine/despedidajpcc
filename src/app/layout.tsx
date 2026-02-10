import type { Metadata } from "next";
import { Anton, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import WelcomeModal from "@/components/WelcomeModal";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DESPEDIDA DE SOLTEROS JPCC | ALAMICOS R.F.C | Lomas de Mantagua 2026",
  description: "Despedida de solteros JPCC — ALAMICOS R.F.C. Lomas de Mantagua, Viña del Mar. 20-22 Febrero 2026. Playa, verano y fiesta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased min-h-screen text-foreground overflow-x-hidden relative">
        {/* Fondo verde */}
        <div
          className="fixed inset-0 z-0"
          style={{
            background: "linear-gradient(180deg, #061408 0%, #0c4a6e 25%, #0f766e 50%, #134e4a 70%, #0d0618 100%)",
          }}
          aria-hidden
        />
        {/* Logo Alamicos encima del verde, transparente para que se vea como marca de agua */}
        <div
          className="fixed inset-0 z-0 bg-center bg-no-repeat bg-[length:min(70vh,70vw)] opacity-[0.18] pointer-events-none"
          style={{ backgroundImage: "url(/logo-alamicos.png)" }}
          aria-hidden
        />
        <div className="grain-overlay" aria-hidden />
        <WelcomeModal />
        <div className="relative z-10">{children}</div>
        <SpotifyPlayer />
      </body>
    </html>
  );
}
