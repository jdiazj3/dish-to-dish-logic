
-- Add positive amount constraints to facturas table using validation trigger
CREATE OR REPLACE FUNCTION public.validate_factura_amounts()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.subtotal < 0 THEN
    RAISE EXCEPTION 'subtotal must be >= 0';
  END IF;
  IF NEW.impuestos < 0 THEN
    RAISE EXCEPTION 'impuestos must be >= 0';
  END IF;
  IF NEW.propina IS NOT NULL AND NEW.propina < 0 THEN
    RAISE EXCEPTION 'propina must be >= 0';
  END IF;
  IF NEW.total < 0 THEN
    RAISE EXCEPTION 'total must be >= 0';
  END IF;
  IF NEW.metodo_pago IS NOT NULL AND NEW.metodo_pago NOT IN ('efectivo', 'debito', 'credito', 'nequi', 'daviplata') THEN
    RAISE EXCEPTION 'Invalid metodo_pago value';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_factura_before_insert
  BEFORE INSERT OR UPDATE ON public.facturas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_factura_amounts();
