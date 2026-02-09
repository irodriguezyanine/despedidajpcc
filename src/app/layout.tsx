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
      <body className="antialiased min-h-screen bg-background text-foreground overflow-x-hidden">
        <div className="grain-overlay" aria-hidden />
        <WelcomeModal />
        {children}
        <SpotifyPlayer />
      </body>
    </html>
  );
}
