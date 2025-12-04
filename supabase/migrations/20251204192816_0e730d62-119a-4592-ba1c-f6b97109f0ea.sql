-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "Users pueden ver sus roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins pueden gestionar roles" ON public.user_roles;

-- Crear políticas PERMISIVAS correctas
CREATE POLICY "Users pueden ver sus roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING ((user_id = auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "Admins pueden gestionar roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));