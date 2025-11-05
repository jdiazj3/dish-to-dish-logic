-- Crear bucket para fotos de productos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productos', 'productos', true);

-- Políticas de storage para productos
CREATE POLICY "Todos pueden ver fotos de productos"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

CREATE POLICY "Admins pueden subir fotos de productos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'productos' AND
  (SELECT public.is_admin(auth.uid()))
);

CREATE POLICY "Admins pueden actualizar fotos de productos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'productos' AND
  (SELECT public.is_admin(auth.uid()))
);

CREATE POLICY "Admins pueden eliminar fotos de productos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'productos' AND
  (SELECT public.is_admin(auth.uid()))
);