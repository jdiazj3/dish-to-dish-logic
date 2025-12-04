-- Agregar campo para referencia de transferencia en facturas
ALTER TABLE public.facturas 
ADD COLUMN referencia_pago text;