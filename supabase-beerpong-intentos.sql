-- Migración: permitir múltiples intentos por jugador (Rodri intento 2, intento 3...)
-- Ejecutar en Supabase SQL Editor
-- 1. Entra a supabase.com/dashboard > tu proyecto > SQL Editor > New query
-- 2. Pega este código y Run

-- Quitar UNIQUE de name_lower para permitir mismo nombre varias veces
ALTER TABLE beerpong_leaderboard DROP CONSTRAINT IF EXISTS beerpong_leaderboard_name_lower_key;

-- Agregar columna client_id (id del participante que envía el cliente)
ALTER TABLE beerpong_leaderboard ADD COLUMN IF NOT EXISTS client_id TEXT;

-- Para filas existentes sin client_id, asignar uno único
UPDATE beerpong_leaderboard SET client_id = id::text WHERE client_id IS NULL;

-- Hacer client_id NOT NULL
ALTER TABLE beerpong_leaderboard ALTER COLUMN client_id SET NOT NULL;

-- Índice único en client_id para upsert
DROP INDEX IF EXISTS beerpong_leaderboard_client_id_key;
CREATE UNIQUE INDEX beerpong_leaderboard_client_id_key ON beerpong_leaderboard (client_id);
