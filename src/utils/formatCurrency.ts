/**
 * Formatea un número como pesos colombianos (COP)
 * @param value - El valor numérico a formatear
 * @param showDecimals - Si mostrar decimales (default: false para COP)
 * @returns String formateado como moneda colombiana
 */
export function formatCOP(value: number | string | null | undefined, showDecimals = false): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  
  if (isNaN(numValue)) return '$0';
  
  return numValue.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
}

/**
 * Formatea un número con separadores de miles colombianos (sin símbolo de moneda)
 * @param value - El valor numérico a formatear
 * @returns String formateado con separadores de miles
 */
export function formatNumber(value: number | string | null | undefined): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
