
-- 1) Restrict public SELECT policies to authenticated users
DROP POLICY IF EXISTS "Todos pueden ver insumos" ON public.insumos_restaurante;
CREATE POLICY "Usuarios autenticados pueden ver insumos" ON public.insumos_restaurante FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Todos pueden ver entradas de insumos" ON public.inventario_entradas_insumos;
CREATE POLICY "Usuarios autenticados pueden ver entradas de insumos" ON public.inventario_entradas_insumos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Todos pueden ver entradas" ON public.inventario_entradas;
CREATE POLICY "Usuarios autenticados pueden ver entradas" ON public.inventario_entradas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Todos pueden ver stock" ON public.inventario_stock;
CREATE POLICY "Usuarios autenticados pueden ver stock" ON public.inventario_stock FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Todos pueden ver proveedores" ON public.proveedores;
CREATE POLICY "Usuarios autenticados pueden ver proveedores" ON public.proveedores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Todos pueden ver configuración de puntos" ON public.puntos_configuracion;
CREATE POLICY "Usuarios autenticados pueden ver configuración de puntos" ON public.puntos_configuracion FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Todos pueden ver tipos de insumos" ON public.tipos_insumos;
CREATE POLICY "Usuarios autenticados pueden ver tipos de insumos" ON public.tipos_insumos FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.insumos_restaurante, public.inventario_entradas_insumos, public.inventario_entradas,
  public.inventario_stock, public.proveedores, public.puntos_configuracion, public.tipos_insumos FROM anon;

-- 2) Prevent listing of public buckets (files remain reachable via their public URLs)
DROP POLICY IF EXISTS "Todos pueden ver avatares" ON storage.objects;
DROP POLICY IF EXISTS "Todos pueden ver fotos de productos" ON storage.objects;
DROP POLICY IF EXISTS "Todos pueden ver logos de sedes" ON storage.objects;

-- 3) Revoke direct API execution of internal SECURITY DEFINER routines
REVOKE EXECUTE ON FUNCTION public.reset_orden_counter() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.actualizar_stock_insumo() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.actualizar_stock_entrada() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.actualizar_saldo_cuenta_movimiento() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.procesar_transferencia() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
