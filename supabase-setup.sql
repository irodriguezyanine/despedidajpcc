-- Ejecuta este SQL en el editor SQL de tu proyecto Supabase
-- (Dashboard > SQL Editor > New query)

-- Tabla para la tabla de puntajes del Beer Pong (compartida entre todos los dispositivos)
-- client_id: id del participante (permite múltiples intentos: Rodri intento 2, 3...)
CREATE TABLE IF NOT EXISTS beerpong_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_lower TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Permitir lectura y escritura pública (para la API sin autenticación)
ALTER TABLE beerpong_leaderboard ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen (para poder ejecutar el script varias veces)
DROP POLICY IF EXISTS "Permitir lectura pública" ON beerpong_leaderboard;
DROP POLICY IF EXISTS "Permitir escritura pública" ON beerpong_leaderboard;

CREATE POLICY "Permitir lectura pública" ON beerpong_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Permitir escritura pública" ON beerpong_leaderboard
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Tabla para la encuesta (MVP y perrita)
-- ============================================
CREATE TABLE IF NOT EXISTS encuesta_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  email_lower TEXT NOT NULL,
  name TEXT NOT NULL,
  mvp TEXT NOT NULL,
  mas_perra TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email_lower)
);

ALTER TABLE encuesta_votos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Encuesta lectura pública" ON encuesta_votos;
DROP POLICY IF EXISTS "Encuesta escritura pública" ON encuesta_votos;

CREATE POLICY "Encuesta lectura pública" ON encuesta_votos
  FOR SELECT USING (true);

CREATE POLICY "Encuesta escritura pública" ON encuesta_votos
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Para borrar Rodri 33 de la tabla beerpong (ejecutar si ya existe):
-- ============================================
-- DELETE FROM beerpong_leaderboard WHERE name_lower = 'rodri';
