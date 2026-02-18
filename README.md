# Despedida de Solteros JPCC · ALAMICOS R.F.C

Sitio web de la despedida de solteros de Juan Pablo (Juampi) — **ALAMICOS R.F.C** (Reggaeton Fútbol Club).

- **Fecha:** 20-22 Febrero 2026  
- **Destino:** Calle La Isla, parcela 6c. Quintero (Al frente de Sunshine)

## Contenido

- Cuenta regresiva hasta el 20 de febrero de 2026
- Plantilla del equipo (nombre, apodo, número de camiseta)
- Itinerario Viernes y Sábado
- Mapa de ubicación (Calle La Isla, Quintero)
- Reproductor Spotify (canción de la despedida)
- Modal de bienvenida

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Supabase (Beer Pong + Encuesta)

Para que los puntajes del Beer Pong y los votos de la encuesta se guarden entre todos los dispositivos:

1. Crea un proyecto en [Supabase](https://supabase.com) (gratis).
2. En el SQL Editor de Supabase, ejecuta el contenido de `supabase-setup.sql` (crea las tablas `beerpong_leaderboard` y `encuesta_votos`).
3. Copia `.env.example` a `.env.local` y añade tu URL y clave de Supabase (desde Project Settings > API).
4. Reinicia el servidor de desarrollo.

**Dónde ejecutar el SQL:**
1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Abre tu proyecto
3. Menú izquierdo → **SQL Editor**
4. **New query**
5. Pega el contenido del archivo SQL y haz clic en **Run** (o Ctrl+Enter)

- Solo encuesta: `supabase-encuesta-solo.sql` (si beerpong ya está configurado)
- Múltiples intentos por jugador: `supabase-beerpong-intentos.sql` (Rodri intento 2, intento 3...)
- Borrar Rodri: `supabase-borrar-rodri.sql`

Sin Supabase configurado, los datos se guardan solo en el navegador (localStorage).

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
