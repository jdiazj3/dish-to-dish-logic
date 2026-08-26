# Dashboard financiero para el dueño: rentabilidad y punto de equilibrio

## Qué ya existe hoy (en /admin/reportes)

| Ya lo tenemos | Dónde | Observación |
|---|---|---|
| Inversión vs ventas y margen del período + PDF | `ReporteRentabilidad` | Usa **compras de inventario** del período como "costo", no el costo de lo realmente vendido (CMV). Distorsiona el margen en meses con compras grandes. |
| Margen real por producto (receta de insumos / costo promedio) | `RentabilidadPorProducto` | Base sólida; ya trae unidades, ventas, costo y margen por plato. |
| Tendencia de margen 12 semanas | `GraficoMargenSemanal` | Mismo criterio de compras, no CMV. |
| Alerta de margen bajo + umbral configurable | `AlertaMargenBajo`, `ConfiguracionAlertasRentabilidad` | Se conserva tal cual. |
| Ventas por período, productos más/menos vendidos, ranking de empleados, turno, sede, valeras | varios | Se conservan. |
| Widget de margen en el dashboard | `WidgetMargenRentabilidad` | Único indicador financiero del tab Dashboard hoy. |

**Lo que NO existe:** ningún reporte cruza las ventas con el **flujo de caja** (`movimientos_caja`, `gastos_recurrentes`). Por eso hoy no hay utilidad operativa real ni punto de equilibrio.

## Lo nuevo a construir

## 1. Nuevo bloque superior: "Semáforo del mes"

Cinco tarjetas con datos del mes en curso (y comparativo vs. mes anterior en %):

- **Ventas netas** — suma de `facturas.total` del período.
- **Costo de ventas (CMV)** — suma de `factura_items.cantidad × costo_unitario` del producto (usa `vista_costos_productos`, que ya combina recetas de insumos y costo promedio de compra).
- **Margen de contribución** — Ventas − CMV, con su % (indicador clave para el equilibrio).
- **Gastos fijos del mes** — salidas aprobadas de `movimientos_caja` en categorías de tipo fijo + gastos programados del mes.
- **Utilidad operativa** — Margen de contribución − Gastos fijos. Verde/rojo según signo.

## 2. Panel de Punto de Equilibrio (el más valioso)

Cálculo:

```text
% margen de contribución = (Ventas - CMV) / Ventas
Punto de equilibrio ($)  = Gastos fijos del mes / % margen de contribución
Punto de equilibrio diario = PE mensual / días de operación del mes
Ticket promedio          = Ventas / N° de facturas
Almuerzos/día necesarios = PE diario / ticket promedio
```

Se muestra como:
- Barra de progreso "Vas en $X de $Y para cubrir costos" con % alcanzado.
- Día del mes estimado en que se cruza el punto de equilibrio (proyección con el ritmo actual).
- Frase accionable: "Necesitas vender ~N almuerzos por día para no perder plata".
- Escenarios rápidos: qué pasa si subo precios 5%, si bajo costo de insumos 5%, o si recorto $X de gastos fijos.

## 3. Estructura de costos y fugas

- **Dona de estructura**: CMV / gastos fijos / gastos variables / utilidad, sobre las ventas.
- **Top 5 gastos** del mes por categoría (desde `movimientos_caja` + `categorias_gastos`), con variación vs. mes anterior.
- **Alerta de fuga**: productos vendidos con margen por debajo del umbral configurado, ordenados por *pérdida total* (margen negativo × unidades), no solo por %. Reutiliza el umbral de `alertas_rentabilidad_config`.

## 4. Matriz de menú (menu engineering)

Nuevo, pero **reutiliza los datos que ya calcula `RentabilidadPorProducto`** (unidades, costo real, margen): en vez de solo una tabla, se grafican los cuadrantes popularidad vs. margen:

- **Estrellas** (alta venta, alto margen) → promover.
- **Caballos de batalla** (alta venta, bajo margen) → subir precio o rebajar receta.
- **Rompecabezas** (baja venta, alto margen) → empujar en carta y sugerencia del mesero.
- **Perros** (baja venta, bajo margen) → sacar del menú.

Con lista accionable por cuadrante y export a PDF.


## 5. Flujo de caja proyectado (30 días)

Línea con saldo actual de `cuentas_flujo` + ventas proyectadas − gastos programados pendientes (`gastos_recurrentes.proximo_pago`), marcando los días en que el saldo quedaría en rojo.

## Cambios técnicos

- Vista SQL `vista_rentabilidad_diaria`: por día → ventas, CMV (vía `factura_items` × `vista_costos_productos`), margen bruto y N° de facturas.
- Vista SQL `vista_gastos_mensuales`: salidas aprobadas de `movimientos_caja` agrupadas por mes y por tipo de categoría (fijo/variable).
- Marcar en `categorias_gastos` cuáles son fijas (el campo `tipo` ya existe; se normalizan valores a `fijo`/`variable`).
- Nuevo hook `useIndicadoresFinancieros(periodo)` que consolida ventas, CMV, gastos y punto de equilibrio.
- Nuevos componentes en `src/components/admin/dashboard/`: `SemaforoMes`, `PanelPuntoEquilibrio`, `EstructuraCostos`, `MatrizMenu`, `ProyeccionFlujoCaja`.
- El tab **Dashboard** de `/admin` pasa a: semáforo → punto de equilibrio → estructura de costos + matriz de menú → órdenes en tiempo real (se conserva). Los gráficos actuales de ventas se mantienen más abajo.
- Selector de período (mes actual / mes anterior / rango) reutilizando `FiltrosReportes`.
- Todos los valores con `formatCOP()`.
