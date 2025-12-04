-- Agregar columna de notas a orden_productos
ALTER TABLE public.orden_productos 
ADD COLUMN notas text;