import { Boxes, ChartNoAxesCombined, Target, Ticket, Gift, Wallet, type LucideIcon } from "lucide-react";

export const WHATSAPP_URL = "https://wa.me/573025848474?text=" + encodeURIComponent("Hola, quiero conocer Ancestrale Cloud y probar el producto.");

export interface ModuloDiferencial {
  slug: string;
  icon: LucideIcon;
  nombre: string;
  titular: string;
  resumen: string;
  problema: string;
  promesa: string;
  beneficios: { titulo: string; texto: string }[];
  pasos: string[];
  comparativa: { item: string; otros: boolean }[];
  faqs: { q: string; a: string }[];
}

export const modulos: ModuloDiferencial[] = [
  {
    slug: "inventario",
    icon: Boxes,
    nombre: "Inventario inteligente",
    titular: "Sabe cuánto tienes y cuándo se acaba",
    resumen: "Compras, stock, recetas y descuento automático por venta. Cortes semanales y mensuales.",
    problema: "¿Se te pierde inventario y no sabes dónde?",
    promesa: "Cada plato vendido descuenta sus ingredientes. Sabrás exactamente cuánto stock tienes, cuándo se acaba y dónde se van las mermas.",
    beneficios: [
      { titulo: "Descuento automático", texto: "Al facturar un plato se restan los insumos de su receta. Sin conteos manuales diarios." },
      { titulo: "Cortes semanales y mensuales", texto: "Compara compras contra consumo y detecta diferencias antes de que te cuesten dinero." },
      { titulo: "Costo real por plato", texto: "Si la libra de pollo sube de $12.000 a $14.000, ves al instante cómo cambia tu margen." },
    ],
    pasos: ["Registra tus insumos y proveedores", "Arma la receta de cada plato", "Registra cada compra: el stock y el costo se actualizan", "Revisa alertas de stock bajo y el corte del período"],
    comparativa: [
      { item: "Recetas con cantidades por plato", otros: false },
      { item: "Descuento de stock al vender", otros: false },
      { item: "Costo promedio actualizado por compra", otros: false },
      { item: "Registro de productos", otros: true },
    ],
    faqs: [
      { q: "¿Tengo que contar todo cada día?", a: "No. El sistema descuenta por venta; solo haces conteos periódicos para validar." },
      { q: "¿Sirve para bebidas y productos empacados?", a: "Sí, puedes controlar productos directos además de insumos con receta." },
      { q: "¿Maneja varios proveedores?", a: "Sí, cada compra queda asociada a su proveedor y costo." },
    ],
  },
  {
    slug: "reportes",
    icon: ChartNoAxesCombined,
    nombre: "Gerencia y reportes",
    titular: "Decide con números, no con intuición",
    resumen: "Ventas por sede, turno, mesero y plato; rentabilidad real por producto.",
    problema: "¿Sabes qué plato te deja más plata y cuál te hace perder?",
    promesa: "Un tablero para el dueño con ventas, costos y ganancia, filtrable por sede y fechas.",
    beneficios: [
      { titulo: "Rentabilidad por plato", texto: "Margen real con el costo de los insumos consumidos, no estimado." },
      { titulo: "Equipo y turnos", texto: "Ranking de meseros y cocineros, y ventas por turno para organizar personal." },
      { titulo: "Multi-sede", texto: "Compara tus locales lado a lado o mira cada uno por separado." },
    ],
    pasos: ["Opera normalmente: meseros, cocina y caja", "Abre Reportes y elige período y sede", "Revisa ventas, ranking y rentabilidad", "Recibe alertas de margen bajo por correo"],
    comparativa: [
      { item: "Margen real por plato desde recetas", otros: false },
      { item: "Matriz de menú (estrellas, perros…)", otros: false },
      { item: "Alertas semanales de margen bajo", otros: false },
      { item: "Reporte de ventas del día", otros: true },
    ],
    faqs: [
      { q: "¿Puedo verlo desde el celular?", a: "Sí, todo funciona en el navegador del celular o computador." },
      { q: "¿Puedo exportar los reportes?", a: "Sí, y las facturas se generan en PDF." },
      { q: "¿Mis administradores de sede ven todo?", a: "No, cada rol ve solo lo que le corresponde." },
    ],
  },
  {
    slug: "punto-de-equilibrio",
    icon: Target,
    nombre: "Punto de equilibrio",
    titular: "Cuánto te falta vender hoy para ganar",
    resumen: "Meta diaria, día estimado de equilibrio y escenarios (subir precio, bajar insumos).",
    problema: "¿Sabes en qué día del mes empiezas a ganar plata?",
    promesa: "Cruzamos ventas, costo de insumos y gastos fijos para decirte cuánto vender y cuándo llegas a la meta.",
    beneficios: [
      { titulo: "Meta clara", texto: "Ejemplo: \"Te faltan $3.200.000; vende $410.000 diarios (unas 18 cuentas)\"." },
      { titulo: "Día estimado", texto: "Ves en qué fecha del mes cubres arriendo, nómina y servicios." },
      { titulo: "Escenarios", texto: "Simula subir precios 5%, bajar insumos 5% o recortar gastos fijos 10%." },
    ],
    pasos: ["Registra tus gastos fijos (arriendo, nómina, servicios)", "Factura como siempre", "El panel calcula tu equilibrio en tiempo real", "Ajusta precios o costos con los escenarios"],
    comparativa: [
      { item: "Punto de equilibrio automático", otros: false },
      { item: "Simulador de escenarios", otros: false },
      { item: "Semáforo mensual del negocio", otros: false },
      { item: "Total vendido del día", otros: true },
    ],
    faqs: [
      { q: "¿Necesito saber de contabilidad?", a: "No. Te lo mostramos en frases simples y una barra de avance." },
      { q: "¿De dónde salen los gastos?", a: "De los gastos programados y salidas de caja que registras." },
      { q: "¿Se actualiza solo?", a: "Sí, con cada factura y cada gasto." },
    ],
  },
  {
    slug: "valera",
    icon: Ticket,
    nombre: "Valera prepagada",
    titular: "Vende 10 o 20 almuerzos por adelantado",
    resumen: "Código QR, redención en caja, caducidad y topes diarios. Liquidez inmediata.",
    problema: "¿Tus clientes fijos almuerzan contigo pero pagas proveedores antes de recibir su dinero?",
    promesa: "Vende paquetes de almuerzos prepagados: recibes el dinero hoy y el cliente consume con un QR.",
    beneficios: [
      { titulo: "Plata por adelantado", texto: "Una valera de 20 almuerzos a $15.000 = $300.000 en caja desde el primer día." },
      { titulo: "Cero papel", texto: "Código QR impreso o en el celular; se descuenta en caja en segundos." },
      { titulo: "Reglas a tu medida", texto: "Caducidad, máximo por día, horarios y días permitidos." },
    ],
    pasos: ["Caja vende la valera y entrega el QR", "El cliente almuerza y presenta su QR", "Caja lo escanea y descuenta un almuerzo", "Reporte de valeras activas, consumidas y vencidas"],
    comparativa: [
      { item: "Valeras prepagadas con QR", otros: false },
      { item: "Valera como medio de pago en caja", otros: false },
      { item: "Topes diarios y franjas horarias", otros: false },
    ],
    faqs: [
      { q: "¿Y si el cliente pierde el QR?", a: "Se puede buscar por cédula y reimprimir." },
      { q: "¿Puede compartirla?", a: "Tú decides con el tope diario de consumos." },
      { q: "¿Vence?", a: "Solo si configuras días de caducidad." },
    ],
  },
  {
    slug: "fidelizacion",
    icon: Gift,
    nombre: "Tickets promocionales y fidelización",
    titular: "Promociones que traen clientes de vuelta",
    resumen: "Puntos de fidelidad por cada compra y beneficios canjeables en caja.",
    problema: "¿Tu cliente vuelve porque le gusta, o porque tiene un motivo?",
    promesa: "Cada factura suma puntos al cliente por su cédula; los canjea por beneficios y regresa más seguido.",
    beneficios: [
      { titulo: "Base de clientes propia", texto: "Se llena sola con la cédula al facturar." },
      { titulo: "Puntos automáticos", texto: "Configuras cuántos puntos da cada compra." },
      { titulo: "Promociones con valeras", texto: "Combina puntos y paquetes prepagados para premiar a los fieles." },
    ],
    pasos: ["Configura la regla de puntos", "Caja factura con la cédula del cliente", "Los puntos se acumulan solos", "El cliente canjea en su próxima visita"],
    comparativa: [
      { item: "Puntos ligados a la factura", otros: false },
      { item: "Base de clientes por cédula", otros: false },
      { item: "Facturación básica", otros: true },
    ],
    faqs: [
      { q: "¿El cliente necesita una app?", a: "No, solo dar su cédula en caja." },
      { q: "¿Puedo cambiar la regla de puntos?", a: "Sí, en la configuración de puntos." },
      { q: "¿Funciona en varias sedes?", a: "Sí, los puntos son del cliente en todo el negocio." },
    ],
  },
  {
    slug: "flujo-de-caja",
    icon: Wallet,
    nombre: "Flujo de caja y gastos",
    titular: "Ningún pago fijo te toma por sorpresa",
    resumen: "Gastos programados con alertas, cierre de caja y proyección a 30 días.",
    problema: "¿Te ha llegado el arriendo y no había plata en caja?",
    promesa: "Programa tus pagos, recibe alertas y mira cuánto dinero tendrás en los próximos 30 días.",
    beneficios: [
      { titulo: "Gastos programados", texto: "Arriendo, nómina, servicios: con fecha, alerta y registro del pago." },
      { titulo: "Cierre de caja diario", texto: "Efectivo, débito, crédito, Nequi y Daviplata cuadrados." },
      { titulo: "Proyección 30 días", texto: "Saldo esperado combinando ventas estimadas y pagos pendientes." },
    ],
    pasos: ["Crea tus gastos recurrentes", "Recibe la alerta antes del vencimiento", "Paga y queda registrado como salida", "Revisa la proyección de caja"],
    comparativa: [
      { item: "Gastos programados con alertas", otros: false },
      { item: "Proyección de caja a 30 días", otros: false },
      { item: "Cierre de caja", otros: true },
    ],
    faqs: [
      { q: "¿Maneja varias cuentas?", a: "Sí, caja, bancos y billeteras digitales." },
      { q: "¿Puedo editar el monto al pagar?", a: "Sí, por si el servicio llegó distinto." },
      { q: "¿Quién aprueba salidas?", a: "Los administradores, según su rol." },
    ],
  },
];

export const diaAdministrador = [
  { hora: "7:00 a.m.", texto: "Revisa stock bajo y las alertas del día." },
  { hora: "12:00 m.", texto: "Mira ventas y pedidos en vivo, por sede." },
  { hora: "4:00 p.m.", texto: "Registra compras: stock y costos al día." },
  { hora: "10:00 p.m.", texto: "Cierra caja y ve si superó el punto de equilibrio." },
];
