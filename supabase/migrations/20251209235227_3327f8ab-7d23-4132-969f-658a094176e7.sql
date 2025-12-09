-- Agregar columna numero_orden a la tabla ordenes
ALTER TABLE public.ordenes 
ADD COLUMN numero_orden SERIAL;

-- Crear índice para búsquedas rápidas por número de orden
CREATE INDEX idx_ordenes_numero_orden ON public.ordenes(numero_orden);

-- Comentario para documentar el propósito
COMMENT ON COLUMN public.ordenes.numero_orden IS 'Número secuencial de orden para sistema de turnos de cocina';