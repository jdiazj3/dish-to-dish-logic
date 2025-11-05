-- Habilitar realtime para la tabla de facturas (ordenes ya está habilitada)
ALTER PUBLICATION supabase_realtime ADD TABLE facturas;