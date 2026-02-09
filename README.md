# BIOTTI LA ÚLTIMA VUELTA · Floripa 2026

Landing de alto impacto para la despedida de soltero de Sebastián Biotti en Florianópolis, Brasil (21-24 Mayo 2026).

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** + tailwind-merge + clsx
- **Framer Motion** (countdown, scroll reveal, animaciones)
- **Lucide React** (iconos)
- Fuentes: **Anton** (títulos), **Space Grotesk** (cuerpo), **JetBrains Mono** (countdown/códigos)

## Cómo ejecutar

```bash
cd biotti-floripa-2026
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- `src/app/layout.tsx` — Layout con fuentes y grain overlay
- `src/app/page.tsx` — Página principal (Hero, Crew, Vuelos, Footer)
- `src/components/Countdown.tsx` — Cuenta regresiva hasta 21 Mayo 2026 05:00
- `src/components/Hero.tsx` — Hero con countdown y CTA
- `src/components/Squad.tsx` — THE CREW / Wanted List (glass cards)
- `src/components/FlightDashboard.tsx` — Deployment Strategy (vuelos ida/vuelta)
- `src/components/Footer.tsx` — Music & Vibe + frase blockchain

## Build para producción

```bash
npm run build
npm start
```

## Subir a GitHub

1. Crea un repositorio nuevo en [github.com/new](https://github.com/new) (por ejemplo `biotti-floripa-2026`). No marques "Add a README" si ya tienes uno local.
2. En la carpeta del proyecto, enlaza el remoto y sube:

```bash
cd biotti-floripa-2026
git remote add origin https://github.com/TU_USUARIO/biotti-floripa-2026.git
git branch -M main
git push -u origin main
```

Sustituye `TU_USUARIO` por tu usuario de GitHub. Si usas SSH: `git@github.com:TU_USUARIO/biotti-floripa-2026.git`.
