-- Permitir que meseros actualicen sus propias órdenes en estado 'recibida'
CREATE POLICY "Meseros pueden actualizar sus órdenes recibidas"
ON public.ordenes
FOR UPDATE
USING (
  has_role(auth.uid(), 'mesero'::app_role) 
  AND mesero_id = auth.uid() 
  AND estado = 'recibida'
);

-- Permitir que meseros actualicen productos de sus órdenes
CREATE POLICY "Meseros pueden actualizar productos de sus órdenes"
ON public.orden_productos
FOR UPDATE
USING (
  has_role(auth.uid(), 'mesero'::app_role) 
  AND EXISTS (
    SELECT 1 FROM ordenes 
    WHERE ordenes.id = orden_productos.orden_id 
    AND ordenes.mesero_id = auth.uid() 
    AND ordenes.estado = 'recibida'
  )
);

-- Permitir que meseros eliminen productos de sus órdenes
CREATE POLICY "Meseros pueden eliminar productos de sus órdenes"
ON public.orden_productos
FOR DELETE
USING (
  has_role(auth.uid(), 'mesero'::app_role) 
  AND EXISTS (
    SELECT 1 FROM ordenes 
    WHERE ordenes.id = orden_productos.orden_id 
    AND ordenes.mesero_id = auth.uid() 
    AND ordenes.estado = 'recibida'
  )
);