-- 1. Tabla de tipos/categorías de insumos
CREATE TABLE public.tipos_insumos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabla de insumos del restaurante
CREATE TABLE public.insumos_restaurante (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_insumo_id UUID REFERENCES public.tipos_insumos(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida TEXT NOT NULL DEFAULT 'unidad',
  peso_estandar NUMERIC DEFAULT 0,
  precio_referencia NUMERIC DEFAULT 0,
  stock_minimo NUMERIC DEFAULT 0,
  stock_actual NUMERIC DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabla de entradas de inventario para insumos
CREATE TABLE public.inventario_entradas_insumos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insumo_id UUID NOT NULL REFERENCES public.insumos_restaurante(id) ON DELETE CASCADE,
  proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
  cantidad NUMERIC NOT NULL,
  peso NUMERIC,
  precio_compra NUMERIC NOT NULL,
  fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  lote TEXT,
  notas TEXT,
  registrado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.tipos_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumos_restaurante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_entradas_insumos ENABLE ROW LEVEL SECURITY;

-- Políticas para tipos_insumos
CREATE POLICY "Admins pueden gestionar tipos de insumos"
  ON public.tipos_insumos FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Todos pueden ver tipos de insumos"
  ON public.tipos_insumos FOR SELECT
  USING (true);

-- Políticas para insumos_restaurante
CREATE POLICY "Admins pueden gestionar insumos"
  ON public.insumos_restaurante FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Todos pueden ver insumos"
  ON public.insumos_restaurante FOR SELECT
  USING (true);

-- Políticas para inventario_entradas_insumos
CREATE POLICY "Admins pueden gestionar entradas de insumos"
  ON public.inventario_entradas_insumos FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Todos pueden ver entradas de insumos"
  ON public.inventario_entradas_insumos FOR SELECT
  USING (true);

-- Trigger para actualizar stock automáticamente al registrar entrada
CREATE OR REPLACE FUNCTION public.actualizar_stock_insumo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.insumos_restaurante
  SET 
    stock_actual = stock_actual + NEW.cantidad,
    updated_at = now()
  WHERE id = NEW.insumo_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_actualizar_stock_insumo
  AFTER INSERT ON public.inventario_entradas_insumos
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_stock_insumo();

-- Trigger para actualizar updated_at en insumos
CREATE TRIGGER update_insumos_updated_at
  BEFORE UPDATE ON public.insumos_restaurante
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar tipos de insumos iniciales
INSERT INTO public.tipos_insumos (nombre, descripcion) VALUES
  ('Carnes', 'Carnes rojas, pollo, pescado y mariscos'),
  ('Vegetales', 'Verduras, frutas y hortalizas frescas'),
  ('Lácteos', 'Leche, quesos, cremas y derivados'),
  ('Bebidas', 'Gaseosas, jugos, agua y bebidas alcohólicas'),
  ('Granos y Cereales', 'Arroz, frijoles, lentejas, pastas'),
  ('Condimentos', 'Salsas, especias y aderezos'),
  ('Desechables', 'Empaques, servilletas, bolsas'),
  ('Limpieza', 'Productos de aseo y limpieza'),
  ('Otros', 'Insumos varios');