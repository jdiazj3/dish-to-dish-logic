# Propuesta: "Lo que otros sistemas no tienen" — zona diferencial en el Home + páginas completas

## 1. Nueva sección en el Home (después de Características)
Título: **"Mucho más que un POS: gestiona tu restaurante como un negocio"**
Subtítulo: "Ancestrale Cloud incluye módulos que normalmente pagas aparte o llevas en Excel."

Rejilla de 6 tarjetas grandes (icono, titular, 2 líneas, enlace "Ver más →" a su página):

| Módulo | Titular | Mensaje corto |
|---|---|---|
| Inventario inteligente | "Sabe cuánto tienes y cuándo se acaba" | Compras, stock, recetas y descuento automático por venta. Cortes semanales y mensuales. |
| Gerencia y reportes | "Decide con números, no con intuición" | Ventas por sede, turno, mesero y plato; rentabilidad real por producto. |
| Punto de equilibrio | "Cuánto te falta vender hoy para ganar" | Meta diaria, día estimado de equilibrio y escenarios (subir precio, bajar insumos). |
| Valera prepagada | "Vende 10 o 20 almuerzos por adelantado" | Código QR, redención en caja, caducidad y topes diarios. Liquidez inmediata. |
| Tickets promocionales | "Promociones que traen clientes de vuelta" | Tickets/cupones y puntos de fidelidad canjeables en caja. |
| Flujo de caja y gastos | "Ningún pago fijo te toma por sorpresa" | Gastos programados con alertas, cierre de caja y proyección a 30 días. |

Cierre de la sección: franja **"Un día del administrador con Ancestrale"** (línea de tiempo): 7am revisa stock y alertas → 12pm ve ventas en vivo → 4pm registra compras → 10pm cierra caja y ve si superó el punto de equilibrio. Botones "Quiero probarlo" y "Comprar aquí" (WhatsApp).

## 2. Páginas completas (una por módulo), ruta `/soluciones/<modulo>`
Estructura igual en todas:
1. Encabezado con problema del dueño ("¿Se te pierde inventario y no sabes dónde?") y la promesa.
2. 3 beneficios con cifras/ejemplos en COP.
3. "Cómo funciona" en 3–4 pasos con captura real de la plataforma.
4. Comparativa "Otros sistemas vs Ancestrale Cloud" (tabla con ✓ / ✗).
5. Preguntas frecuentes (3–4).
6. Llamado final: formulario de información + WhatsApp.

Páginas: Inventario, Gerencia y reportes, Punto de equilibrio, Valera prepagada, Tickets promocionales y fidelización, Flujo de caja.

Además una página **/soluciones** índice con la tabla comparativa global de todos los módulos.

## Detalles técnicos
- Contenido de módulos en un solo archivo de datos compartido por Home y páginas.
- Componente de página de módulo reutilizable; rutas públicas en App.tsx (no tocan `/app`).
- Capturas reales tomadas de la app con Playwright y guardadas como assets.
- Título/descr. SEO por página.

## Por confirmar
- "Tickets promocionales": hoy existen puntos de fidelidad y valeras; si quieres cupones/tickets de descuento como módulo nuevo, sería un desarrollo aparte. En esta propuesta se presenta como fidelización + valeras.
