-- Crear enum para roles
CREATE TYPE public.app_role AS ENUM ('admin_total', 'admin_sede', 'cajero', 'mesero', 'cocina');

-- Crear enum para turnos
CREATE TYPE public.turno AS ENUM ('manana', 'tarde', 'noche');

-- Crear enum para estado de orden
CREATE TYPE public.estado_orden AS ENUM ('recibida', 'tomada', 'entregada', 'facturada');

-- Tabla de configuración del restaurante
CREATE TABLE public.configuracion_restaurante (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  tiene_domicilios BOOLEAN DEFAULT false,
  pagina_web TEXT,
  instagram TEXT,
  tiktok TEXT,
  facebook TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de sedes
CREATE TABLE public.sedes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  correo TEXT,
  foto_url TEXT,
  sede_id UUID REFERENCES public.sedes(id) ON DELETE SET NULL,
  turno turno,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Tabla de categorías de productos
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de productos/menús
CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  foto_url TEXT,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de salones
CREATE TABLE public.salones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de mesas
CREATE TABLE public.mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  capacidad_sillas INTEGER NOT NULL,
  salon_id UUID REFERENCES public.salones(id) ON DELETE CASCADE NOT NULL,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(numero, salon_id)
);

-- Tabla de órdenes
CREATE TABLE public.ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id UUID REFERENCES public.mesas(id) ON DELETE SET NULL,
  mesero_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cocinero_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  estado estado_orden NOT NULL DEFAULT 'recibida',
  turno turno NOT NULL,
  nombre_cliente TEXT,
  total DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de productos por orden
CREATE TABLE public.orden_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID REFERENCES public.ordenes(id) ON DELETE CASCADE NOT NULL,
  producto_id UUID REFERENCES public.productos(id) ON DELETE RESTRICT NOT NULL,
  numero_silla INTEGER NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de facturas
CREATE TABLE public.facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consecutivo SERIAL NOT NULL UNIQUE,
  orden_id UUID REFERENCES public.ordenes(id) ON DELETE SET NULL,
  cajero_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_cliente TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  impuestos DECIMAL(10,2) NOT NULL,
  propina DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de items de factura (para facturación parcial)
CREATE TABLE public.factura_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES public.facturas(id) ON DELETE CASCADE NOT NULL,
  orden_producto_id UUID REFERENCES public.orden_productos(id) ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracion_restaurante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura_items ENABLE ROW LEVEL SECURITY;

-- Función de seguridad para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Función para verificar si es admin (total o sede)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin_total', 'admin_sede')
  )
$$;

-- RLS Policies

-- Configuración restaurante
CREATE POLICY "Admins pueden ver configuración"
  ON public.configuracion_restaurante FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins pueden editar configuración"
  ON public.configuracion_restaurante FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Sedes
CREATE POLICY "Todos pueden ver sedes"
  ON public.sedes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden gestionar sedes"
  ON public.sedes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Profiles
CREATE POLICY "Users pueden ver su perfil"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins pueden gestionar perfiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- User roles
CREATE POLICY "Users pueden ver sus roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins pueden gestionar roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Categorías
CREATE POLICY "Todos pueden ver categorías"
  ON public.categorias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden gestionar categorías"
  ON public.categorias FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Productos
CREATE POLICY "Todos pueden ver productos"
  ON public.productos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden gestionar productos"
  ON public.productos FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Salones
CREATE POLICY "Todos pueden ver salones"
  ON public.salones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden gestionar salones"
  ON public.salones FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Mesas
CREATE POLICY "Todos pueden ver mesas"
  ON public.mesas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden gestionar mesas"
  ON public.mesas FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Órdenes
CREATE POLICY "Meseros pueden crear órdenes"
  ON public.ordenes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'mesero') AND mesero_id = auth.uid());

CREATE POLICY "Todos pueden ver órdenes"
  ON public.ordenes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cocina puede actualizar órdenes"
  ON public.ordenes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'cocina'));

CREATE POLICY "Admins pueden gestionar órdenes"
  ON public.ordenes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Orden productos
CREATE POLICY "Meseros pueden crear productos de orden"
  ON public.orden_productos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'mesero'));

CREATE POLICY "Todos pueden ver productos de orden"
  ON public.orden_productos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden gestionar productos de orden"
  ON public.orden_productos FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Facturas
CREATE POLICY "Cajeros pueden crear facturas"
  ON public.facturas FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'cajero') AND cajero_id = auth.uid());

CREATE POLICY "Cajeros y admins pueden ver facturas"
  ON public.facturas FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'cajero') OR public.is_admin(auth.uid()));

CREATE POLICY "Admins pueden gestionar facturas"
  ON public.facturas FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Factura items
CREATE POLICY "Cajeros pueden crear items de factura"
  ON public.factura_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'cajero'));

CREATE POLICY "Cajeros y admins pueden ver items de factura"
  ON public.factura_items FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'cajero') OR public.is_admin(auth.uid()));

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_configuracion_restaurante_updated_at
  BEFORE UPDATE ON public.configuracion_restaurante
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sedes_updated_at
  BEFORE UPDATE ON public.sedes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordenes_updated_at
  BEFORE UPDATE ON public.ordenes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, apellido, correo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar realtime para órdenes
ALTER PUBLICATION supabase_realtime ADD TABLE public.ordenes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orden_productos;