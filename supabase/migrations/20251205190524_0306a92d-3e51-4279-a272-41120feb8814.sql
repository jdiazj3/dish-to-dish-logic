-- Crear tabla de proveedores
CREATE TABLE public.proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  correo TEXT,
  direccion TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de entradas de inventario
CREATE TABLE public.inventario_entradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
  cantidad NUMERIC NOT NULL,
  precio_compra NUMERIC NOT NULL,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  lote TEXT,
  fecha_vencimiento DATE,
  notas TEXT,
  registrado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de stock actual
CREATE TABLE public.inventario_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES public.productos(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cantidad_actual NUMERIC NOT NULL DEFAULT 0,
  cantidad_minima NUMERIC DEFAULT 0,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_stock ENABLE ROW LEVEL SECURITY;

-- Políticas para proveedores
CREATE POLICY "Admins pueden gestionar proveedores" ON public.proveedores
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Todos pueden ver proveedores" ON public.proveedores
  FOR SELECT USING (true);

-- Políticas para entradas de inventario
CREATE POLICY "Admins pueden gestionar entradas" ON public.inventario_entradas
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Todos pueden ver entradas" ON public.inventario_entradas
  FOR SELECT USING (true);

-- Políticas para stock
CREATE POLICY "Admins pueden gestionar stock" ON public.inventario_stock
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Todos pueden ver stock" ON public.inventario_stock
  FOR SELECT USING (true);

-- Trigger para actualizar updated_at en proveedores
CREATE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para actualizar stock automáticamente al registrar entrada
CREATE OR REPLACE FUNCTION public.actualizar_stock_entrada()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.inventario_stock (producto_id, cantidad_actual, ultima_actualizacion)
  VALUES (NEW.producto_id, NEW.cantidad, now())
  ON CONFLICT (producto_id) 
  DO UPDATE SET 
    cantidad_actual = inventario_stock.cantidad_actual + NEW.cantidad,
    ultima_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para actualizar stock al insertar entrada
CREATE TRIGGER trigger_actualizar_stock_entrada
  AFTER INSERT ON public.inventario_entradas
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_stock_entrada();