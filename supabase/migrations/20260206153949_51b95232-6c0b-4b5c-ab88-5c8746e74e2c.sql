-- Tabla de cuentas/medios de pago
CREATE TABLE public.cuentas_flujo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'efectivo', -- efectivo, billetera_digital, banco
  descripcion TEXT,
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  saldo_actual NUMERIC NOT NULL DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#6366f1', -- Para identificar visualmente
  icono TEXT DEFAULT 'wallet', -- lucide icon name
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agregar columna cuenta_id a movimientos_caja
ALTER TABLE public.movimientos_caja 
ADD COLUMN cuenta_id UUID REFERENCES public.cuentas_flujo(id);

-- Tabla para transferencias entre cuentas
CREATE TABLE public.transferencias_cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_origen_id UUID NOT NULL REFERENCES public.cuentas_flujo(id),
  cuenta_destino_id UUID NOT NULL REFERENCES public.cuentas_flujo(id),
  monto NUMERIC NOT NULL,
  descripcion TEXT,
  notas TEXT,
  registrado_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT diferentes_cuentas CHECK (cuenta_origen_id != cuenta_destino_id)
);

-- Habilitar RLS
ALTER TABLE public.cuentas_flujo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias_cuentas ENABLE ROW LEVEL SECURITY;

-- Políticas para cuentas_flujo
CREATE POLICY "Admins pueden gestionar cuentas" ON public.cuentas_flujo
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Cajeros y admins pueden ver cuentas" ON public.cuentas_flujo
FOR SELECT USING (has_role(auth.uid(), 'cajero') OR is_admin(auth.uid()));

-- Políticas para transferencias
CREATE POLICY "Admins pueden gestionar transferencias" ON public.transferencias_cuentas
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Cajeros pueden crear transferencias" ON public.transferencias_cuentas
FOR INSERT WITH CHECK (has_role(auth.uid(), 'cajero') AND registrado_por = auth.uid());

CREATE POLICY "Cajeros y admins pueden ver transferencias" ON public.transferencias_cuentas
FOR SELECT USING (has_role(auth.uid(), 'cajero') OR is_admin(auth.uid()));

-- Trigger para actualizar saldos en movimientos
CREATE OR REPLACE FUNCTION public.actualizar_saldo_cuenta_movimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cuenta_id IS NOT NULL AND NEW.estado = 'aprobado' THEN
    IF NEW.tipo = 'entrada' OR NEW.tipo = 'reposicion' THEN
      UPDATE cuentas_flujo SET saldo_actual = saldo_actual + NEW.monto, updated_at = now() WHERE id = NEW.cuenta_id;
    ELSIF NEW.tipo = 'salida' THEN
      UPDATE cuentas_flujo SET saldo_actual = saldo_actual - NEW.monto, updated_at = now() WHERE id = NEW.cuenta_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_actualizar_saldo_movimiento
AFTER INSERT ON public.movimientos_caja
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_saldo_cuenta_movimiento();

-- Trigger para transferencias
CREATE OR REPLACE FUNCTION public.procesar_transferencia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Restar de cuenta origen
  UPDATE cuentas_flujo SET saldo_actual = saldo_actual - NEW.monto, updated_at = now() WHERE id = NEW.cuenta_origen_id;
  -- Sumar a cuenta destino
  UPDATE cuentas_flujo SET saldo_actual = saldo_actual + NEW.monto, updated_at = now() WHERE id = NEW.cuenta_destino_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_procesar_transferencia
AFTER INSERT ON public.transferencias_cuentas
FOR EACH ROW
EXECUTE FUNCTION public.procesar_transferencia();

-- Datos iniciales de cuentas
INSERT INTO public.cuentas_flujo (nombre, tipo, descripcion, saldo_inicial, saldo_actual, color, icono) VALUES
('Efectivo Caja', 'efectivo', 'Dinero en caja física', 0, 0, '#22c55e', 'banknote'),
('Nequi', 'billetera_digital', 'Billetera digital Nequi', 0, 0, '#8b5cf6', 'smartphone'),
('Daviplata', 'billetera_digital', 'Billetera digital Daviplata', 0, 0, '#ef4444', 'smartphone'),
('Cuenta Bancaria', 'banco', 'Cuenta corriente principal', 0, 0, '#3b82f6', 'building-2');