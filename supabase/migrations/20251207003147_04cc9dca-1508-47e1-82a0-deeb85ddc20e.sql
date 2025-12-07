-- Tabla de premios/recompensas disponibles
CREATE TABLE public.premios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  puntos_requeridos integer NOT NULL,
  tipo text NOT NULL DEFAULT 'producto',
  valor_descuento numeric DEFAULT 0,
  producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  stock integer DEFAULT -1,
  activo boolean DEFAULT true,
  imagen_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- tipo puede ser: 'producto' (producto gratis), 'descuento_porcentaje', 'descuento_valor'
-- stock = -1 significa ilimitado

-- Tabla de canjes realizados
CREATE TABLE public.canjes_puntos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  premio_id uuid NOT NULL REFERENCES public.premios(id) ON DELETE CASCADE,
  puntos_usados integer NOT NULL,
  cajero_id uuid,
  estado text NOT NULL DEFAULT 'canjeado',
  factura_id uuid REFERENCES public.facturas(id) ON DELETE SET NULL,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- estado puede ser: 'canjeado', 'aplicado', 'cancelado'

-- Habilitar RLS
ALTER TABLE public.premios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canjes_puntos ENABLE ROW LEVEL SECURITY;

-- Políticas para premios
CREATE POLICY "Admins pueden gestionar premios"
ON public.premios
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Todos pueden ver premios activos"
ON public.premios
FOR SELECT
USING (activo = true OR is_admin(auth.uid()));

-- Políticas para canjes
CREATE POLICY "Admins pueden gestionar canjes"
ON public.canjes_puntos
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Cajeros pueden crear canjes"
ON public.canjes_puntos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'cajero'::app_role));

CREATE POLICY "Cajeros y admins pueden ver canjes"
ON public.canjes_puntos
FOR SELECT
USING (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid()));

-- Trigger para updated_at en premios
CREATE TRIGGER update_premios_updated_at
BEFORE UPDATE ON public.premios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunos premios de ejemplo
INSERT INTO public.premios (nombre, descripcion, puntos_requeridos, tipo, valor_descuento) VALUES
('Postre Gratis', 'Cualquier postre del menú', 50, 'descuento_valor', 15000),
('Descuento 10%', '10% de descuento en tu próxima compra', 100, 'descuento_porcentaje', 10),
('Bebida Gratis', 'Cualquier bebida del menú', 30, 'descuento_valor', 8000),
('Descuento $20.000', '$20.000 de descuento en compras mayores a $50.000', 150, 'descuento_valor', 20000),
('Plato Principal Gratis', 'Un plato principal a elección', 200, 'descuento_valor', 35000);