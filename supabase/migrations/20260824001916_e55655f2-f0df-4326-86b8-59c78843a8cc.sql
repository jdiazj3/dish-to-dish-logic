ALTER TABLE public.valeras_config
  ADD COLUMN IF NOT EXISTS max_por_consumo integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_por_dia integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dias_permitidos integer[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  ADD COLUMN IF NOT EXISTS hora_inicio time,
  ADD COLUMN IF NOT EXISTS hora_fin time;

CREATE OR REPLACE FUNCTION public.marcar_valeras_vencidas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.valeras
    SET estado = 'vencida', updated_at = now()
    WHERE estado = 'activa'
      AND fecha_vencimiento IS NOT NULL
      AND fecha_vencimiento < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.marcar_valeras_vencidas() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.marcar_valeras_vencidas() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consumir_valera(_codigo text, _cantidad integer, _factura_id uuid DEFAULT NULL::uuid)
RETURNS valeras
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.valeras;
  c public.valeras_config;
  v_hoy integer;
  v_dow integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF _cantidad IS NULL OR _cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
  END IF;

  SELECT * INTO c FROM public.valeras_config LIMIT 1;

  -- Reglas de día y horario permitido
  v_dow := EXTRACT(DOW FROM now())::int;
  IF c.dias_permitidos IS NOT NULL AND NOT (v_dow = ANY (c.dias_permitidos)) THEN
    RAISE EXCEPTION 'Las valeras no se pueden redimir hoy (día no permitido)';
  END IF;
  IF c.hora_inicio IS NOT NULL AND c.hora_fin IS NOT NULL
     AND NOT (now()::time BETWEEN c.hora_inicio AND c.hora_fin) THEN
    RAISE EXCEPTION 'Las valeras solo se redimen entre % y %', c.hora_inicio, c.hora_fin;
  END IF;

  IF c.max_por_consumo IS NOT NULL AND c.max_por_consumo > 0 AND _cantidad > c.max_por_consumo THEN
    RAISE EXCEPTION 'Máximo % almuerzos por consumo', c.max_por_consumo;
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
    UPDATE public.valeras SET estado = 'vencida', updated_at = now() WHERE id = v.id;
    RAISE EXCEPTION 'La valera venció el %', to_char(v.fecha_vencimiento, 'DD/MM/YYYY');
  END IF;
  IF v.cantidad_usada + _cantidad > v.cantidad_total THEN
    RAISE EXCEPTION 'Saldo insuficiente: quedan % almuerzos', v.cantidad_total - v.cantidad_usada;
  END IF;

  IF c.max_por_dia IS NOT NULL AND c.max_por_dia > 0 THEN
    SELECT COALESCE(SUM(cantidad), 0) INTO v_hoy
      FROM public.valera_consumos
      WHERE valera_id = v.id AND created_at >= date_trunc('day', now());
    IF v_hoy + _cantidad > c.max_por_dia THEN
      RAISE EXCEPTION 'Límite diario alcanzado: máximo % almuerzos por día (hoy ya se usaron %)', c.max_por_dia, v_hoy;
    END IF;
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