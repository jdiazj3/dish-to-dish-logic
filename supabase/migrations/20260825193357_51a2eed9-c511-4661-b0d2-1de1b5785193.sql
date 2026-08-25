DROP POLICY IF EXISTS "Usuarios autorizados crean items de sus facturas" ON public.factura_items;
DROP POLICY IF EXISTS "Cajeros y admins pueden crear items de factura" ON public.factura_items;
DROP POLICY IF EXISTS "Cajeros pueden crear items de factura" ON public.factura_items;

CREATE POLICY "Caja y administradores crean items de factura"
ON public.factura_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'cajero'::public.app_role)
  OR public.is_admin(auth.uid())
);