-- 1. Agregar campos para pedidos a domicilio en ordenes
ALTER TABLE public.ordenes 
ADD COLUMN IF NOT EXISTS es_domicilio boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS instrucciones_entrega text;

-- 2. Crear salón virtual para domicilios
DO $$
DECLARE
  sede_id_var uuid;
  salon_id_var uuid;
BEGIN
  -- Obtener la primera sede activa
  SELECT id INTO sede_id_var FROM public.sedes WHERE activa = true LIMIT 1;
  
  -- Si no hay sede, crear una por defecto
  IF sede_id_var IS NULL THEN
    INSERT INTO public.sedes (nombre, direccion, activa)
    VALUES ('Sede Principal', 'Dirección por configurar', true)
    RETURNING id INTO sede_id_var;
  END IF;
  
  -- Verificar si ya existe el salón Domicilios
  SELECT id INTO salon_id_var FROM public.salones WHERE nombre = 'Domicilios' AND sede_id = sede_id_var;
  
  -- Si no existe, crearlo con mesas de ejemplo
  IF salon_id_var IS NULL THEN
    INSERT INTO public.salones (nombre, sede_id)
    VALUES ('Domicilios', sede_id_var)
    RETURNING id INTO salon_id_var;
    
    -- Crear mesas virtuales de ejemplo (ubicaciones externas)
    INSERT INTO public.mesas (numero, capacidad_sillas, salon_id, disponible)
    VALUES 
      (1, 10, salon_id_var, true),
      (2, 10, salon_id_var, true),
      (3, 10, salon_id_var, true),
      (4, 10, salon_id_var, true),
      (5, 10, salon_id_var, true);
  END IF;
END $$;

-- 3. Actualizar políticas RLS para que mesero_externo pueda crear órdenes
DROP POLICY IF EXISTS "Meseros pueden crear órdenes" ON public.ordenes;
CREATE POLICY "Meseros pueden crear órdenes" 
ON public.ordenes 
FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'mesero'::app_role) OR has_role(auth.uid(), 'mesero_externo'::app_role)) 
  AND (mesero_id = auth.uid())
);

-- 4. Política para que mesero_externo pueda actualizar sus órdenes recibidas
DROP POLICY IF EXISTS "Meseros pueden actualizar sus órdenes recibidas" ON public.ordenes;
CREATE POLICY "Meseros pueden actualizar sus órdenes recibidas" 
ON public.ordenes 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'mesero'::app_role) OR has_role(auth.uid(), 'mesero_externo'::app_role)) 
  AND (mesero_id = auth.uid()) 
  AND (estado = 'recibida'::estado_orden)
);

-- 5. Actualizar política para crear productos de orden
DROP POLICY IF EXISTS "Meseros pueden crear productos de orden" ON public.orden_productos;
CREATE POLICY "Meseros pueden crear productos de orden" 
ON public.orden_productos 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'mesero'::app_role) OR has_role(auth.uid(), 'mesero_externo'::app_role)
);

-- 6. Actualizar política para actualizar productos de orden
DROP POLICY IF EXISTS "Meseros pueden actualizar productos de sus órdenes" ON public.orden_productos;
CREATE POLICY "Meseros pueden actualizar productos de sus órdenes" 
ON public.orden_productos 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'mesero'::app_role) OR has_role(auth.uid(), 'mesero_externo'::app_role)) 
  AND (EXISTS ( 
    SELECT 1 FROM ordenes 
    WHERE ordenes.id = orden_productos.orden_id 
    AND ordenes.mesero_id = auth.uid() 
    AND ordenes.estado = 'recibida'::estado_orden
  ))
);

-- 7. Actualizar política para eliminar productos de orden
DROP POLICY IF EXISTS "Meseros pueden eliminar productos de sus órdenes" ON public.orden_productos;
CREATE POLICY "Meseros pueden eliminar productos de sus órdenes" 
ON public.orden_productos 
FOR DELETE 
USING (
  (has_role(auth.uid(), 'mesero'::app_role) OR has_role(auth.uid(), 'mesero_externo'::app_role)) 
  AND (EXISTS ( 
    SELECT 1 FROM ordenes 
    WHERE ordenes.id = orden_productos.orden_id 
    AND ordenes.mesero_id = auth.uid() 
    AND ordenes.estado = 'recibida'::estado_orden
  ))
);