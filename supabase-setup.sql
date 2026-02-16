-- Ejecuta este SQL en el editor SQL de tu proyecto Supabase
-- (Dashboard > SQL Editor > New query)

-- Tabla para la tabla de puntajes del Beer Pong (compartida entre todos los dispositivos)
CREATE TABLE IF NOT EXISTS beerpong_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_lower TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name_lower)
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

-- Opcional: insertar jugador de ejemplo
-- INSERT INTO beerpong_leaderboard (name, score) VALUES ('Rodri', 33)
-- ON CONFLICT (name) DO UPDATE SET score = GREATEST(beerpong_leaderboard.score, 33);
