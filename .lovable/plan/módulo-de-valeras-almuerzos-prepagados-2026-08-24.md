# Módulo de Valeras (almuerzos prepagados)

Vender paquetes de almuerzos por adelantado (ej. 10 o 20 almuerzos de $16.000), entregar al cliente un código único + QR, y permitir que ese código funcione como medio de pago en caja descontando platos en lugar de dinero.

## Cómo funcionará

### 1. Venta de la valera (rol caja / admin)
- Nueva pantalla **Caja → Valeras**.
- El cajero elige: producto base (ej. "Almuerzo diario estándar"), cantidad de almuerzos (10, 20 o libre), precio unitario (se precarga desde el producto, editable con descuento opcional), datos del cliente (busca por cédula en la base de clientes existente o crea uno nuevo) y método de pago (efectivo, débito, crédito, nequi, daviplata).
- Al confirmar:
  - Se crea la valera con un **código único** legible (ej. `VAL-2026-0043`) y su **QR**.
  - Se registra el **ingreso completo** del paquete: se genera una factura por el total (10 × $16.000 = $160.000) marcada como venta de valera, y entra en el flujo de caja/cierre del día como ingreso normal.
  - Se muestra un comprobante imprimible 80mm con el QR, el código, el cliente, cuántos almuerzos incluye y la fecha de vencimiento.

### 2. Pago con valera en caja
Dos formas, ambas hacen lo mismo por debajo:
- **Pago rápido (módulo simple):** pantalla "Cobrar con valera" — el cajero escanea el QR con la cámara o teclea el código, ve el saldo (ej. "7 de 10 almuerzos disponibles"), elige cuántos almuerzos consume el cliente y confirma. Se genera la factura y se descuentan los almuerzos.
- **Desde la facturación normal:** al cobrar una mesa, domicilio o mostrador aparece "Valera" como método de pago. El cajero escanea/teclea el código; el sistema descuenta un almuerzo por cada ítem del pedido que corresponda al producto de la valera y cobra aparte (efectivo, tarjeta, etc.) cualquier consumo extra (bebidas, postres, adicionales).

En ambos casos la factura queda con total $0 por la parte cubierta con valera (el dinero ya se cobró al vender la valera), de modo que **no se duplica el ingreso** en los reportes ni en el cierre de caja. La factura muestra "Pagado con valera VAL-2026-0043".

### 3. Control y consultas
- Listado de valeras con estado: activa, agotada, vencida, anulada; saldo de almuerzos, cliente, fecha de venta y vencimiento.
- Detalle de cada valera con su historial de consumos (fecha, cajero, factura).
- Búsqueda por código, cliente o cédula.
- Admin puede anular una valera (con motivo) y definir la vigencia por defecto (ej. 90 días).
- Panel admin: valeras vendidas en el período, dinero recibido por adelantado, almuerzos pendientes de entregar (pasivo del negocio) y valeras vencidas sin usar.

### 4. Reglas de negocio
- El consumo nunca puede superar el saldo de almuerzos.
- Una valera vencida o anulada no se puede usar (el admin puede extender la vigencia).
- Cada consumo queda ligado a la factura que lo generó, para auditoría.
- El descuento de almuerzos y la validación de saldo se hacen en el servidor, no en el navegador, para que no se pueda manipular.
- El inventario sigue descontándose normalmente al facturar el plato consumido.

## Detalles técnicos

**Base de datos (migración)**
- `valeras`: código único, qr_token, cliente_id, producto_id, cantidad_total, cantidad_usada, precio_unitario, total_pagado, metodo_pago_venta, estado (`activa|agotada|vencida|anulada`), fecha_vencimiento, factura_venta_id, vendida_por, notas, timestamps.
- `valera_consumos`: valera_id, factura_id, cantidad, cajero_id, created_at.
- `valeras_config`: vigencia_dias por defecto, producto por defecto, prefijo de código.
- `facturas`: nuevas columnas `valera_id` y `es_venta_valera` para distinguir la venta del paquete del consumo.
- Extender la validación de `metodo_pago` para aceptar `valera`.
- RLS: caja y admin pueden crear/consultar; solo admin anula. GRANT a `authenticated` y `service_role`.
- Funciones `SECURITY DEFINER`: `generar_codigo_valera()` y `consumir_valera(codigo, cantidad, factura_id)` que valida estado/vigencia/saldo de forma atómica y marca `agotada` al llegar a cero.

**Frontend**
- `src/pages/CajeroValeras.tsx` (venta + listado) y `src/pages/CajeroCobrarValera.tsx` (pago rápido con escáner), con rutas en `App.tsx` y accesos en `CajeroDashboard`.
- `src/components/cajero/valeras/`: `VenderValera`, `ListaValeras`, `DetalleValera`, `EscanerValera` (cámara vía `html5-qrcode` + entrada manual), `ComprobanteValera` (impresión 80mm con QR generado por `qrcode`).
- Integración de "Valera" como método de pago en `FacturacionOrdenes.tsx`, `CajeroFacturacionDomicilios.tsx` y `CajeroMostrador.tsx`.
- `src/components/admin/reportes/ReporteValeras.tsx` en Reportes, y ajuste de `CierreCaja` / `ReporteMetodosPago` para separar ingreso por venta de valeras vs. consumos ($0).
- Nuevas dependencias: `qrcode` y `html5-qrcode`.
