DROP POLICY IF EXISTS "Facturadores pueden crear items de sus facturas" ON public.factura_items;

CREATE POLICY "Usuarios autorizados crean items de sus facturas"
ON public.factura_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.facturas f
    WHERE f.id = factura_items.factura_id
      AND (f.cajero_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);