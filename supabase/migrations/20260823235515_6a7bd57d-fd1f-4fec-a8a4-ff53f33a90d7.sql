CREATE TABLE public.recetas_productos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES public.insumos_restaurante(id) ON DELETE RESTRICT,
  cantidad numeric NOT NULL CHECK (cantidad > 0),
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (producto_id, insumo_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recetas_productos TO authenticated;
GRANT ALL ON public.recetas_productos TO service_role;

ALTER TABLE public.recetas_productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden ver recetas"
ON public.recetas_productos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gestionan recetas"
ON public.recetas_productos FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_recetas_productos_updated_at
BEFORE UPDATE ON public.recetas_productos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE VIEW public.vista_costos_insumos
WITH (security_invoker = true) AS
SELECT
  i.id AS insumo_id,
  i.nombre,
  i.unidad_medida,
  COALESCE(
    NULLIF(SUM(e.cantidad * e.precio_compra), 0) / NULLIF(SUM(e.cantidad), 0),
    i.precio_referencia,
    0
  )::numeric AS costo_unitario,
  (SUM(e.cantidad) IS NOT NULL) AS tiene_compras
FROM public.insumos_restaurante i
LEFT JOIN public.inventario_entradas_insumos e ON e.insumo_id = i.id
GROUP BY i.id, i.nombre, i.unidad_medida, i.precio_referencia;

GRANT SELECT ON public.vista_costos_insumos TO authenticated;
GRANT ALL ON public.vista_costos_insumos TO service_role;

CREATE VIEW public.vista_costos_productos
WITH (security_invoker = true) AS
WITH costo_receta AS (
  SELECT r.producto_id,
         SUM(r.cantidad * ci.costo_unitario) AS costo,
         COUNT(*) AS items
  FROM public.recetas_productos r
  JOIN public.vista_costos_insumos ci ON ci.insumo_id = r.insumo_id
  GROUP BY r.producto_id
),
costo_compra AS (
  SELECT ie.producto_id,
         NULLIF(SUM(ie.cantidad * ie.precio_compra), 0) / NULLIF(SUM(ie.cantidad), 0) AS costo
  FROM public.inventario_entradas ie
  WHERE ie.producto_id IS NOT NULL
  GROUP BY ie.producto_id
)
SELECT
  p.id AS producto_id,
  p.nombre,
  p.precio,
  p.controla_inventario,
  COALESCE(cr.costo, cc.costo, 0)::numeric AS costo_unitario,
  CASE
    WHEN cr.costo IS NOT NULL THEN 'receta'
    WHEN cc.costo IS NOT NULL THEN 'compra'
    ELSE 'sin_datos'
  END AS origen_costo,
  COALESCE(cr.items, 0)::int AS insumos_en_receta,
  CASE
    WHEN p.precio > 0 AND COALESCE(cr.costo, cc.costo) IS NOT NULL
      THEN ((p.precio - COALESCE(cr.costo, cc.costo)) / p.precio) * 100
    ELSE NULL
  END::numeric AS margen
FROM public.productos p
LEFT JOIN costo_receta cr ON cr.producto_id = p.id
LEFT JOIN costo_compra cc ON cc.producto_id = p.id;

GRANT SELECT ON public.vista_costos_productos TO authenticated;
GRANT ALL ON public.vista_costos_productos TO service_role;