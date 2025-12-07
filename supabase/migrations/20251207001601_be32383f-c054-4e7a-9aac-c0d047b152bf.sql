-- Tabla de configuración de puntos por turno
CREATE TABLE public.puntos_configuracion (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno public.turno NOT NULL,
  puntos_por_peso numeric NOT NULL DEFAULT 1,
  monto_base numeric NOT NULL DEFAULT 1000,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(turno)
);

-- Comentario: puntos_por_peso / monto_base = puntos por cada X pesos
-- Ej: 1 punto por cada 1000 pesos gastados

-- Tabla de puntos acumulados por cliente por factura
CREATE TABLE public.puntos_cliente (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  factura_id uuid NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  puntos_otorgados integer NOT NULL DEFAULT 0,
  turno public.turno NOT NULL,
  monto_factura numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(factura_id)
);

-- Habilitar RLS
ALTER TABLE public.puntos_configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puntos_cliente ENABLE ROW LEVEL SECURITY;

-- Políticas para puntos_configuracion
CREATE POLICY "Admins pueden gestionar configuración de puntos"
ON public.puntos_configuracion
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Todos pueden ver configuración de puntos"
ON public.puntos_configuracion
FOR SELECT
USING (true);

-- Políticas para puntos_cliente
CREATE POLICY "Admins pueden gestionar puntos de clientes"
ON public.puntos_cliente
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Cajeros pueden crear puntos"
ON public.puntos_cliente
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'cajero'::app_role));

CREATE POLICY "Cajeros y admins pueden ver puntos"
ON public.puntos_cliente
FOR SELECT
USING (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid()));

-- Trigger para updated_at en configuración
CREATE TRIGGER update_puntos_configuracion_updated_at
BEFORE UPDATE ON public.puntos_configuracion
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar configuración inicial por turno
INSERT INTO public.puntos_configuracion (turno, puntos_por_peso, monto_base, descripcion) VALUES
('manana', 1, 1000, 'Turno mañana: 1 punto por cada $1,000'),
('tarde', 1, 1000, 'Turno tarde: 1 punto por cada $1,000'),
('noche', 2, 1000, 'Turno noche: 2 puntos por cada $1,000 (promoción nocturna)');