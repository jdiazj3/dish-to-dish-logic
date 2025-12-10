-- Crear función para reiniciar el contador de órdenes
CREATE OR REPLACE FUNCTION public.reset_orden_counter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Reiniciar la secuencia a 1
  ALTER SEQUENCE ordenes_numero_orden_seq RESTART WITH 1;
END;
$$;

-- Habilitar la extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Otorgar permisos para usar cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;