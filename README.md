# Despedida de Solteros JPCC · ALAMICOS R.F.C

Sitio web de la despedida de solteros de Juan Pablo (Juampi) — **ALAMICOS R.F.C** (Reggaeton Fútbol Club).

- **Fecha:** 20-22 Febrero 2026  
- **Destino:** Lomas de Mantagua, Viña del Mar (playa chilena, verano)

## Contenido

- Cuenta regresiva hasta el 20 de febrero de 2026
- Plantilla del equipo (nombre, apodo, número de camiseta)
- Itinerario Viernes y Sábado
- Mapa de ubicación (Lomas de Mantagua)
- Reproductor Spotify (canción de la despedida)
- Modal de bienvenida

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Tabla de puntajes del Beer Pong (compartida entre dispositivos)

Para que los puntajes se guarden entre todos los jugadores (no solo en el dispositivo donde se juega):

1. Crea un proyecto en [Supabase](https://supabase.com) (gratis).
2. En el SQL Editor de Supabase, ejecuta el contenido de `supabase-setup.sql`.
3. Copia `.env.example` a `.env.local` y añade tu URL y clave de Supabase (desde Project Settings > API).
4. Reinicia el servidor de desarrollo.

Sin Supabase configurado, los puntajes se guardan solo en el navegador (localStorage).

## Subir a GitHub

Si aún no tienes el remoto configurado:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/ignaciorodriguezyanine/despedidajp.git
git push -u origin main
```

## Tecnologías

- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
