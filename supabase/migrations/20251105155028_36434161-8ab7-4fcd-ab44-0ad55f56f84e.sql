-- Crear bucket para avatares si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatares', 'avatares', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para avatares: todos pueden ver, solo admins pueden subir/actualizar/eliminar
CREATE POLICY "Todos pueden ver avatares"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatares');

CREATE POLICY "Admins pueden subir avatares"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatares' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins pueden actualizar avatares"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatares' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins pueden eliminar avatares"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatares' 
  AND is_admin(auth.uid())
);