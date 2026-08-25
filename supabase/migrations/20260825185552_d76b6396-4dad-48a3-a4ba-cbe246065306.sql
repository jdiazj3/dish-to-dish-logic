CREATE TABLE public.pagos_gastos_programados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gasto_recurrente_id uuid NOT NULL REFERENCES public.gastos_recurrentes(id) ON DELETE CASCADE,
  movimiento_caja_id uuid REFERENCES public.movimientos_caja(id) ON DELETE SET NULL,
  cuenta_id uuid REFERENCES public.cuentas_flujo(id),
  monto_pagado numeric NOT NULL,
  fecha_pago date NOT NULL DEFAULT CURRENT_DATE,
  periodo date,
  pagado_por uuid,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagos_gastos_programados TO authenticated;
GRANT ALL ON public.pagos_gastos_programados TO service_role;

ALTER TABLE public.pagos_gastos_programados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cajeros y admins pueden ver pagos programados"
ON public.pagos_gastos_programados FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid()));

CREATE POLICY "Admins pueden gestionar pagos programados"
ON public.pagos_gastos_programados FOR ALL TO authenticated
USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_pagos_gastos_programados_gasto ON public.pagos_gastos_programados(gasto_recurrente_id, fecha_pago DESC);

CREATE OR REPLACE FUNCTION public.pagar_gasto_programado(
  _gasto_id uuid,
  _monto numeric,
  _cuenta_id uuid DEFAULT NULL,
  _fecha_pago date DEFAULT CURRENT_DATE,
  _comprobante_url text DEFAULT NULL,
  _notas text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  g public.gastos_recurrentes;
  v_mov_id uuid;
  v_pago_id uuid;
  v_base date;
  v_next date;
BEGIN
  IF auth.uid() IS NULL OR NOT (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF _monto IS NULL OR _monto <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero';
  END IF;

  SELECT * INTO g FROM public.gastos_recurrentes WHERE id = _gasto_id FOR UPDATE;
  IF g.id IS NULL THEN
    RAISE EXCEPTION 'Gasto programado no encontrado';
  END IF;

  INSERT INTO public.movimientos_caja (
    tipo, monto, categoria_gasto_id, cuenta_id, descripcion, notas,
    comprobante_url, registrado_por, estado, fecha_movimiento
  ) VALUES (
    'salida', _monto, g.categoria_gasto_id, _cuenta_id,
    'Gasto programado: ' || g.nombre, _notas,
    _comprobante_url, auth.uid(), 'aprobado', COALESCE(_fecha_pago, CURRENT_DATE)
  ) RETURNING id INTO v_mov_id;

  INSERT INTO public.pagos_gastos_programados (
    gasto_recurrente_id, movimiento_caja_id, cuenta_id, monto_pagado,
    fecha_pago, periodo, pagado_por, notas
  ) VALUES (
    g.id, v_mov_id, _cuenta_id, _monto,
    COALESCE(_fecha_pago, CURRENT_DATE), g.proximo_pago, auth.uid(), _notas
  ) RETURNING id INTO v_pago_id;

  v_base := COALESCE(g.proximo_pago, COALESCE(_fecha_pago, CURRENT_DATE));
  v_next := CASE g.frecuencia
    WHEN 'semanal' THEN v_base + interval '7 days'
    WHEN 'quincenal' THEN v_base + interval '15 days'
    WHEN 'mensual' THEN v_base + interval '1 month'
    WHEN 'bimestral' THEN v_base + interval '2 months'
    WHEN 'trimestral' THEN v_base + interval '3 months'
    WHEN 'semestral' THEN v_base + interval '6 months'
    WHEN 'anual' THEN v_base + interval '1 year'
    ELSE v_base + interval '1 month'
  END;

  -- si la fecha base estaba vencida, avanzar hasta superar hoy
  WHILE v_next <= CURRENT_DATE LOOP
    v_next := CASE g.frecuencia
      WHEN 'semanal' THEN v_next + interval '7 days'
      WHEN 'quincenal' THEN v_next + interval '15 days'
      WHEN 'mensual' THEN v_next + interval '1 month'
      WHEN 'bimestral' THEN v_next + interval '2 months'
      WHEN 'trimestral' THEN v_next + interval '3 months'
      WHEN 'semestral' THEN v_next + interval '6 months'
      WHEN 'anual' THEN v_next + interval '1 year'
      ELSE v_next + interval '1 month'
    END;
  END LOOP;

  UPDATE public.gastos_recurrentes
    SET proximo_pago = v_next, updated_at = now()
    WHERE id = g.id;

  RETURN v_pago_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.pagar_gasto_programado(uuid, numeric, uuid, date, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.pagar_gasto_programado(uuid, numeric, uuid, date, text, text) TO authenticated;