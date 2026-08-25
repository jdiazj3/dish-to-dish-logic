DROP POLICY IF EXISTS "Cajeros pueden crear items de factura" ON public.factura_items;
CREATE POLICY "Cajeros y admins pueden crear items de factura"
ON public.factura_items FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid()));