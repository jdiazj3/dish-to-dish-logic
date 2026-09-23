ALTER TABLE public.categorias_gastos ADD COLUMN IF NOT EXISTS es_fijo boolean NOT NULL DEFAULT false;

UPDATE public.categorias_gastos SET es_fijo = true WHERE tipo IN ('nomina','servicios');

CREATE OR REPLACE VIEW public.vista_rentabilidad_diaria
WITH (security_invoker = true) AS
SELECT
  (f.created_at AT TIME ZONE 'America/Bogota')::date AS dia,
  COUNT(DISTINCT f.id)::integer AS num_facturas,
  COALESCE(SUM(f.total), 0) AS ventas,
  COALESCE((
    SELECT SUM(fi.cantidad * COALESCE(vcp.costo_unitario, 0))
    FROM public.factura_items fi
    LEFT JOIN public.vista_costos_productos vcp ON vcp.producto_id = fi.producto_id
    WHERE fi.factura_id = ANY (ARRAY_AGG(f.id))
  ), 0) AS cmv
FROM public.facturas f
GROUP BY 1;

CREATE OR REPLACE VIEW public.vista_gastos_mensuales
WITH (security_invoker = true) AS
SELECT
  date_trunc('month', m.fecha_movimiento)::date AS mes,
  COALESCE(cg.es_fijo, false) AS es_fijo,
  cg.id AS categoria_id,
  COALESCE(cg.nombre, 'Sin categoría') AS categoria,
  SUM(m.monto) AS total
FROM public.movimientos_caja m
LEFT JOIN public.categorias_gastos cg ON cg.id = m.categoria_gasto_id
WHERE m.tipo = 'salida' AND m.estado = 'aprobado'
GROUP BY 1, 2, 3, 4;

GRANT SELECT ON public.vista_rentabilidad_diaria TO authenticated;
GRANT SELECT ON public.vista_gastos_mensuales TO authenticated;