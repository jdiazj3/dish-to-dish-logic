-- 1. Marcar productos de reventa (bebidas, helados, etc.) que llevan control de inventario
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS controla_inventario boolean NOT NULL DEFAULT false;

-- 2. Guardar el producto en el ítem de factura para poder descontar stock
ALTER TABLE public.factura_items
  ADD COLUMN IF NOT EXISTS producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_factura_items_producto_id ON public.factura_items(producto_id);

-- 3. Asegurar unicidad de stock por producto (necesario para el upsert)
CREATE UNIQUE INDEX IF NOT EXISTS inventario_stock_producto_id_key
  ON public.inventario_stock(producto_id);

-- 4. Descontar stock automáticamente al facturar productos de reventa
CREATE OR REPLACE FUNCTION public.descontar_stock_venta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_controla boolean;
BEGIN
  IF NEW.producto_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT controla_inventario INTO v_controla
  FROM public.productos
  WHERE id = NEW.producto_id;

  IF COALESCE(v_controla, false) THEN
    INSERT INTO public.inventario_stock (producto_id, cantidad_actual, ultima_actualizacion)
    VALUES (NEW.producto_id, -NEW.cantidad, now())
    ON CONFLICT (producto_id)
    DO UPDATE SET
      cantidad_actual = inventario_stock.cantidad_actual - NEW.cantidad,
      ultima_actualizacion = now();
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.descontar_stock_venta() FROM anon, PUBLIC;

DROP TRIGGER IF EXISTS trigger_descontar_stock_venta ON public.factura_items;
CREATE TRIGGER trigger_descontar_stock_venta
AFTER INSERT ON public.factura_items
FOR EACH ROW EXECUTE FUNCTION public.descontar_stock_venta();