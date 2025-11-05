-- Agregar campos adicionales a la tabla sedes
ALTER TABLE sedes 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS correo TEXT,
ADD COLUMN IF NOT EXISTS horario_apertura TIME,
ADD COLUMN IF NOT EXISTS horario_cierre TIME,
ADD COLUMN IF NOT EXISTS dias_operacion TEXT[],
ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Crear bucket para logos de sedes si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos-sedes', 'logos-sedes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para logos de sedes
DROP POLICY IF EXISTS "Todos pueden ver logos de sedes" ON storage.objects;
DROP POLICY IF EXISTS "Admins pueden subir logos de sedes" ON storage.objects;
DROP POLICY IF EXISTS "Admins pueden actualizar logos de sedes" ON storage.objects;
DROP POLICY IF EXISTS "Admins pueden eliminar logos de sedes" ON storage.objects;

CREATE POLICY "Todos pueden ver logos de sedes"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos-sedes');

CREATE POLICY "Admins pueden subir logos de sedes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos-sedes' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins pueden actualizar logos de sedes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos-sedes' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins pueden eliminar logos de sedes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos-sedes' 
  AND is_admin(auth.uid())
);