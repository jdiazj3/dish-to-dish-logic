-- Crear política para que los cajeros puedan marcar productos como facturados
CREATE POLICY "Cajeros pueden marcar productos como facturados"
ON public.orden_productos
FOR UPDATE
USING (has_role(auth.uid(), 'cajero'::app_role))
WITH CHECK (has_role(auth.uid(), 'cajero'::app_role));