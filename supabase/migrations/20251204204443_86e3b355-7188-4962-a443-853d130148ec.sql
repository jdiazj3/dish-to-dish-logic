-- Agregar columnas para Nequi y Daviplata en cierres_caja
ALTER TABLE public.cierres_caja 
ADD COLUMN total_nequi numeric NOT NULL DEFAULT 0,
ADD COLUMN total_daviplata numeric NOT NULL DEFAULT 0;