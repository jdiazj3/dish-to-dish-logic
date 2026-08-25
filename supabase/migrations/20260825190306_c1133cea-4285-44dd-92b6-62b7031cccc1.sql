ALTER TABLE public.movimientos_caja
  ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES public.proveedores(id);

ALTER TABLE public.movimientos_caja
  ADD CONSTRAINT movimientos_caja_registrado_por_fkey
  FOREIGN KEY (registrado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.transferencias_cuentas
  ADD CONSTRAINT transferencias_cuentas_registrado_por_fkey
  FOREIGN KEY (registrado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;