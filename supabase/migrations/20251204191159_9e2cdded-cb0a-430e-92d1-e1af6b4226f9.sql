-- Agregar columna para marcar productos facturados
ALTER TABLE public.orden_productos 
ADD COLUMN facturado boolean DEFAULT false;

-- Actualizar productos ya facturados basándose en factura_items existentes
UPDATE public.orden_productos op
SET facturado = true
WHERE EXISTS (
  SELECT 1 FROM public.factura_items fi
  WHERE fi.orden_producto_id = op.id
);