-- Enum para tipos de movimiento
CREATE TYPE public.tipo_movimiento_caja AS ENUM ('entrada', 'salida', 'reposicion');

-- Enum para estado de movimiento
CREATE TYPE public.estado_movimiento AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- Tabla de categorías de gastos
CREATE TABLE public.categorias_gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL DEFAULT 'operativo', -- operativo, nomina, servicios, insumos, otros
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.categorias_gastos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorias_gastos
CREATE POLICY "Admins pueden gestionar categorías de gastos"
  ON public.categorias_gastos FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Cajeros y admins pueden ver categorías de gastos"
  ON public.categorias_gastos FOR SELECT
  USING (has_role(auth.uid(), 'cajero') OR is_admin(auth.uid()));

-- Tabla principal de movimientos de caja
CREATE TABLE public.movimientos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_movimiento_caja NOT NULL,
  monto NUMERIC NOT NULL CHECK (monto > 0),
  categoria_gasto_id UUID REFERENCES public.categorias_gastos(id),
  descripcion TEXT NOT NULL,
  comprobante_url TEXT, -- URL del comprobante (opcional)
  estado estado_movimiento NOT NULL DEFAULT 'aprobado',
  registrado_por UUID NOT NULL,
  aprobado_por UUID,
  fecha_movimiento DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.movimientos_caja ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para movimientos_caja
CREATE POLICY "Admins pueden gestionar movimientos"
  ON public.movimientos_caja FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Cajeros pueden crear movimientos"
  ON public.movimientos_caja FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'cajero') AND registrado_por = auth.uid());

CREATE POLICY "Cajeros y admins pueden ver movimientos"
  ON public.movimientos_caja FOR SELECT
  USING (has_role(auth.uid(), 'cajero') OR is_admin(auth.uid()));

-- Tabla de configuración de caja menor
CREATE TABLE public.caja_menor_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monto_base NUMERIC NOT NULL DEFAULT 500000, -- Fondo inicial de caja menor
  umbral_reposicion NUMERIC NOT NULL DEFAULT 100000, -- Cuando baja de este monto, alertar
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.caja_menor_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para caja_menor_config
CREATE POLICY "Admins pueden gestionar configuración de caja menor"
  ON public.caja_menor_config FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Cajeros y admins pueden ver configuración"
  ON public.caja_menor_config FOR SELECT
  USING (has_role(auth.uid(), 'cajero') OR is_admin(auth.uid()));

-- Tabla de gastos recurrentes (programados)
CREATE TABLE public.gastos_recurrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria_gasto_id UUID REFERENCES public.categorias_gastos(id),
  monto_estimado NUMERIC NOT NULL CHECK (monto_estimado > 0),
  frecuencia TEXT NOT NULL DEFAULT 'mensual', -- diario, semanal, mensual, anual
  dia_pago INTEGER, -- día del mes (1-31) o día de la semana (1-7)
  proximo_pago DATE,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.gastos_recurrentes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para gastos_recurrentes
CREATE POLICY "Admins pueden gestionar gastos recurrentes"
  ON public.gastos_recurrentes FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Cajeros y admins pueden ver gastos recurrentes"
  ON public.gastos_recurrentes FOR SELECT
  USING (has_role(auth.uid(), 'cajero') OR is_admin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_movimientos_caja_updated_at
  BEFORE UPDATE ON public.movimientos_caja
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_caja_menor_config_updated_at
  BEFORE UPDATE ON public.caja_menor_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gastos_recurrentes_updated_at
  BEFORE UPDATE ON public.gastos_recurrentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar categorías de gastos predeterminadas
INSERT INTO public.categorias_gastos (nombre, descripcion, tipo) VALUES
  ('Insumos', 'Compra de insumos y materias primas', 'insumos'),
  ('Servicios Públicos', 'Agua, luz, gas, internet', 'servicios'),
  ('Nómina', 'Pagos de salarios y prestaciones', 'nomina'),
  ('Arriendo', 'Pago de arriendo del local', 'operativo'),
  ('Mantenimiento', 'Reparaciones y mantenimiento', 'operativo'),
  ('Transporte', 'Domicilios, envíos, transporte', 'operativo'),
  ('Aseo', 'Productos de limpieza', 'operativo'),
  ('Otros', 'Gastos varios no categorizados', 'otros');

-- Insertar configuración inicial de caja menor
INSERT INTO public.caja_menor_config (monto_base, umbral_reposicion) VALUES (500000, 100000);

-- Crear bucket para comprobantes (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para comprobantes
CREATE POLICY "Cajeros y admins pueden subir comprobantes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comprobantes' AND
    (has_role(auth.uid(), 'cajero') OR is_admin(auth.uid()))
  );

CREATE POLICY "Cajeros y admins pueden ver comprobantes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'comprobantes' AND
    (has_role(auth.uid(), 'cajero') OR is_admin(auth.uid()))
  );

CREATE POLICY "Admins pueden eliminar comprobantes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'comprobantes' AND is_admin(auth.uid()));