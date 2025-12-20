-- Tabla para configuración de alertas de rentabilidad
CREATE TABLE public.alertas_rentabilidad_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  margen_minimo DECIMAL NOT NULL DEFAULT 20,
  email_admin TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.alertas_rentabilidad_config ENABLE ROW LEVEL SECURITY;

-- Solo admin_total puede ver y modificar la configuración
CREATE POLICY "Solo admin_total puede ver configuración de alertas"
ON public.alertas_rentabilidad_config
FOR SELECT
USING (public.has_role(auth.uid(), 'admin_total'));

CREATE POLICY "Solo admin_total puede modificar configuración de alertas"
ON public.alertas_rentabilidad_config
FOR ALL
USING (public.has_role(auth.uid(), 'admin_total'));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_alertas_rentabilidad_config_updated_at
BEFORE UPDATE ON public.alertas_rentabilidad_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar configuración inicial
INSERT INTO public.alertas_rentabilidad_config (margen_minimo, activo)
VALUES (20, true);