-- ============================================
-- SOLO ENCUESTA - Ejecutar en Supabase
-- ============================================
-- 1. Entra a https://supabase.com/dashboard
-- 2. Abre tu proyecto
-- 3. Menú izquierdo: SQL Editor
-- 4. New query
-- 5. Pega este código y haz clic en Run (o Ctrl+Enter)
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
