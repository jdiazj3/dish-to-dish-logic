-- Create table for frequent customers
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT,
  apellido TEXT,
  cedula TEXT UNIQUE,
  celular TEXT,
  correo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Cajeros y admins pueden ver clientes"
ON public.clientes
FOR SELECT
USING (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid()));

CREATE POLICY "Cajeros pueden crear clientes"
ON public.clientes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid()));

CREATE POLICY "Admins pueden gestionar clientes"
ON public.clientes
FOR ALL
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add cliente_id to facturas table for linking
ALTER TABLE public.facturas ADD COLUMN cliente_id UUID REFERENCES public.clientes(id);