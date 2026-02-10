import type { Metadata } from "next";
import { Anton, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import WelcomeModal from "@/components/WelcomeModal";
import BackToTop from "@/components/BackToTop";

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

const siteUrl = "https://despedidajpcc.vercel.app";

export const metadata: Metadata = {
  title: "DESPEDIDA DE SOLTERO JPCC | ALAMICOS . Maitencillo 2026",
  description: "CUENTA REGRESIVA: 20 - 22 Febrero 2026",
  icons: {
    icon: "/logo-alamicos.png",
    apple: "/logo-alamicos.png",
  },
  openGraph: {
    title: "DESPEDIDA DE SOLTERO JPCC | ALAMICOS . Maitencillo 2026",
    description: "CUENTA REGRESIVA: 20 - 22 Febrero 2026",
    url: siteUrl,
    siteName: "Despedida JPCC Alamicos",
    locale: "es_CL",
    type: "website",
    images: [{ url: `${siteUrl}/logo-alamicos.png`, width: 512, height: 512, alt: "ALAMICOS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DESPEDIDA DE SOLTERO JPCC | ALAMICOS . Maitencillo 2026",
    description: "CUENTA REGRESIVA: 20 - 22 Febrero 2026",
    images: [`${siteUrl}/logo-alamicos.png`],
  },
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
        {/* Accesibilidad: saltar al contenido (visible al enfocar con teclado) */}
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[10001] -translate-y-[200%] rounded-lg bg-red-500 px-4 py-2 font-body text-sm font-medium text-white shadow-lg focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#0d0618]"
        >
          Saltar al contenido principal
        </a>
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
          className="fixed inset-0 z-0 bg-center bg-no-repeat bg-[length:min(70vh,70vw)] opacity-[0.28] pointer-events-none"
          style={{ backgroundImage: "url(/logo-alamicos.png)" }}
          aria-hidden
        />
        <div className="grain-overlay" aria-hidden />
        <WelcomeModal />
        <div className="relative z-10">{children}</div>
        <SpotifyPlayer />
        <BackToTop />
      </body>
    </html>
  );
}
