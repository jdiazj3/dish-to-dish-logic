-- Crear tabla para cierres de caja
CREATE TABLE public.cierres_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cajero_id uuid REFERENCES auth.users(id),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  efectivo_inicial numeric NOT NULL DEFAULT 0,
  efectivo_final numeric NOT NULL DEFAULT 0,
  total_efectivo numeric NOT NULL DEFAULT 0,
  total_tarjeta_debito numeric NOT NULL DEFAULT 0,
  total_tarjeta_credito numeric NOT NULL DEFAULT 0,
  total_ventas numeric NOT NULL DEFAULT 0,
  diferencia numeric NOT NULL DEFAULT 0,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(fecha, cajero_id)
);

-- Agregar columna método de pago a facturas si no existe
ALTER TABLE public.facturas 
ADD COLUMN IF NOT EXISTS metodo_pago text DEFAULT 'efectivo';

-- Habilitar RLS
ALTER TABLE public.cierres_caja ENABLE ROW LEVEL SECURITY;

-- Políticas para cierres de caja
CREATE POLICY "Cajeros pueden crear cierres" 
ON public.cierres_caja 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'cajero') AND cajero_id = auth.uid());

CREATE POLICY "Cajeros pueden ver sus cierres" 
ON public.cierres_caja 
FOR SELECT 
TO authenticated
USING (cajero_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins pueden gestionar cierres" 
ON public.cierres_caja 
FOR ALL 
TO authenticated
USING (is_admin(auth.uid()));