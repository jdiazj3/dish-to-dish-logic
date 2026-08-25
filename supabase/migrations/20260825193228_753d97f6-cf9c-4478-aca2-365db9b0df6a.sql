DROP POLICY IF EXISTS "Cajeros y admins pueden crear items de factura" ON public.factura_items;

CREATE POLICY "Facturadores pueden crear items de sus facturas"
ON public.factura_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.facturas f
    WHERE f.id = factura_items.factura_id
      AND (
        (f.cajero_id = auth.uid() AND public.has_role(auth.uid(), 'cajero'::public.app_role))
        OR public.is_admin(auth.uid())
      )
  )
);