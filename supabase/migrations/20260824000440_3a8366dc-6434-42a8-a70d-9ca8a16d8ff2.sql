-- Config
CREATE TABLE public.valeras_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vigencia_dias integer NOT NULL DEFAULT 90,
  producto_default_id uuid REFERENCES public.productos(id),
  prefijo text NOT NULL DEFAULT 'VAL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.valeras_config TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.valeras_config TO authenticated;
GRANT ALL ON public.valeras_config TO service_role;
ALTER TABLE public.valeras_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "valeras_config_select" ON public.valeras_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "valeras_config_admin" ON public.valeras_config FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER update_valeras_config_updated_at BEFORE UPDATE ON public.valeras_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Valeras
CREATE TABLE public.valeras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  qr_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  cliente_id uuid REFERENCES public.clientes(id),
  nombre_cliente text,
  producto_id uuid REFERENCES public.productos(id),
  producto_nombre text NOT NULL,
  cantidad_total integer NOT NULL CHECK (cantidad_total > 0),
  cantidad_usada integer NOT NULL DEFAULT 0 CHECK (cantidad_usada >= 0),
  precio_unitario numeric NOT NULL CHECK (precio_unitario >= 0),
  total_pagado numeric NOT NULL CHECK (total_pagado >= 0),
  metodo_pago_venta text NOT NULL DEFAULT 'efectivo',
  estado text NOT NULL DEFAULT 'activa',
  fecha_vencimiento date,
  factura_venta_id uuid REFERENCES public.facturas(id),
  vendida_por uuid,
  notas text,
  motivo_anulacion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valeras_estado_check CHECK (estado IN ('activa','agotada','vencida','anulada')),
  CONSTRAINT valeras_saldo_check CHECK (cantidad_usada <= cantidad_total)
);
GRANT SELECT, INSERT, UPDATE ON public.valeras TO authenticated;
GRANT ALL ON public.valeras TO service_role;
ALTER TABLE public.valeras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "valeras_select" ON public.valeras FOR SELECT TO authenticated USING (true);
CREATE POLICY "valeras_insert" ON public.valeras FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "valeras_update_admin" ON public.valeras FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER update_valeras_updated_at BEFORE UPDATE ON public.valeras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_valeras_codigo ON public.valeras(codigo);
CREATE INDEX idx_valeras_cliente ON public.valeras(cliente_id);
CREATE INDEX idx_valeras_estado ON public.valeras(estado);

-- Consumos
CREATE TABLE public.valera_consumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valera_id uuid NOT NULL REFERENCES public.valeras(id) ON DELETE CASCADE,
  factura_id uuid REFERENCES public.facturas(id),
  cantidad integer NOT NULL CHECK (cantidad > 0),
  cajero_id uuid,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.valera_consumos TO authenticated;
GRANT ALL ON public.valera_consumos TO service_role;
ALTER TABLE public.valera_consumos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "valera_consumos_select" ON public.valera_consumos FOR SELECT TO authenticated USING (true);
CREATE POLICY "valera_consumos_insert" ON public.valera_consumos FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_valera_consumos_valera ON public.valera_consumos(valera_id);

-- Facturas: enlace con valera
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS valera_id uuid REFERENCES public.valeras(id);
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS es_venta_valera boolean NOT NULL DEFAULT false;

-- Permitir metodo_pago 'valera'
CREATE OR REPLACE FUNCTION public.validate_factura_amounts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.subtotal < 0 THEN RAISE EXCEPTION 'subtotal must be >= 0'; END IF;
  IF NEW.impuestos < 0 THEN RAISE EXCEPTION 'impuestos must be >= 0'; END IF;
  IF NEW.propina IS NOT NULL AND NEW.propina < 0 THEN RAISE EXCEPTION 'propina must be >= 0'; END IF;
  IF NEW.total < 0 THEN RAISE EXCEPTION 'total must be >= 0'; END IF;
  IF NEW.metodo_pago IS NOT NULL AND NEW.metodo_pago NOT IN ('efectivo','debito','credito','nequi','daviplata','valera') THEN
    RAISE EXCEPTION 'Invalid metodo_pago value';
  END IF;
  RETURN NEW;
END;
$function$;

-- Generar codigo unico
CREATE OR REPLACE FUNCTION public.generar_codigo_valera()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefijo text;
  v_codigo text;
  v_n integer;
BEGIN
  SELECT COALESCE(prefijo,'VAL') INTO v_prefijo FROM public.valeras_config LIMIT 1;
  v_prefijo := COALESCE(v_prefijo, 'VAL');
  LOOP
    SELECT COUNT(*) + 1 INTO v_n FROM public.valeras
      WHERE created_at >= date_trunc('year', now());
    v_codigo := v_prefijo || '-' || to_char(now(), 'YYYY') || '-' || lpad(v_n::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.valeras WHERE codigo = v_codigo);
    v_n := v_n + 1;
    v_codigo := v_prefijo || '-' || to_char(now(), 'YYYY') || '-' || lpad(v_n::text, 4, '0')
                || '-' || substr(md5(random()::text), 1, 3);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.valeras WHERE codigo = v_codigo);
  END LOOP;
  RETURN v_codigo;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.generar_codigo_valera() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generar_codigo_valera() TO authenticated, service_role;

-- Consumir valera (atomico)
CREATE OR REPLACE FUNCTION public.consumir_valera(_codigo text, _cantidad integer, _factura_id uuid DEFAULT NULL)
RETURNS public.valeras
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.valeras;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF _cantidad IS NULL OR _cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
  END IF;

  SELECT * INTO v FROM public.valeras
    WHERE codigo = upper(trim(_codigo)) OR qr_token::text = trim(_codigo)
    FOR UPDATE;

  IF v.id IS NULL THEN
    RAISE EXCEPTION 'Valera no encontrada';
  END IF;
  IF v.estado = 'anulada' THEN
    RAISE EXCEPTION 'La valera está anulada';
  END IF;
  IF v.fecha_vencimiento IS NOT NULL AND v.fecha_vencimiento < CURRENT_DATE THEN
    UPDATE public.valeras SET estado = 'vencida' WHERE id = v.id;
    RAISE EXCEPTION 'La valera está vencida';
  END IF;
  IF v.cantidad_usada + _cantidad > v.cantidad_total THEN
    RAISE EXCEPTION 'Saldo insuficiente: quedan % almuerzos', v.cantidad_total - v.cantidad_usada;
  END IF;

  UPDATE public.valeras
    SET cantidad_usada = cantidad_usada + _cantidad,
        estado = CASE WHEN cantidad_usada + _cantidad >= cantidad_total THEN 'agotada' ELSE 'activa' END,
        updated_at = now()
    WHERE id = v.id
    RETURNING * INTO v;

  INSERT INTO public.valera_consumos (valera_id, factura_id, cantidad, cajero_id)
  VALUES (v.id, _factura_id, _cantidad, auth.uid());

  RETURN v;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consumir_valera(text, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consumir_valera(text, integer, uuid) TO authenticated, service_role;

-- Buscar valera por codigo o token (lectura segura)
CREATE OR REPLACE FUNCTION public.buscar_valera(_codigo text)
RETURNS public.valeras
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.valeras
  WHERE codigo = upper(trim(_codigo)) OR qr_token::text = trim(_codigo)
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.buscar_valera(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_valera(text) TO authenticated, service_role;

INSERT INTO public.valeras_config (vigencia_dias, prefijo) VALUES (90, 'VAL');