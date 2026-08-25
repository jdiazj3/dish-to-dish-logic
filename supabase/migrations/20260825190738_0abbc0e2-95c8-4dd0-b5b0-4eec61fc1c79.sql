DROP POLICY IF EXISTS "Cajeros pueden crear gastos recurrentes" ON public.gastos_recurrentes;
CREATE POLICY "Cajeros pueden crear gastos recurrentes"
ON public.gastos_recurrentes FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Cajeros pueden editar gastos recurrentes" ON public.gastos_recurrentes;
CREATE POLICY "Cajeros pueden editar gastos recurrentes"
ON public.gastos_recurrentes FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'cajero'::app_role) OR is_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gastos_recurrentes TO authenticated;
GRANT ALL ON public.gastos_recurrentes TO service_role;