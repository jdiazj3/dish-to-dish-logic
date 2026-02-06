export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alertas_rentabilidad_config: {
        Row: {
          activo: boolean
          created_at: string
          email_admin: string | null
          id: string
          margen_minimo: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email_admin?: string | null
          id?: string
          margen_minimo?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email_admin?: string | null
          id?: string
          margen_minimo?: number
          updated_at?: string
        }
        Relationships: []
      }
      caja_menor_config: {
        Row: {
          activo: boolean | null
          created_at: string
          id: string
          monto_base: number
          umbral_reposicion: number
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          id?: string
          monto_base?: number
          umbral_reposicion?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          id?: string
          monto_base?: number
          umbral_reposicion?: number
          updated_at?: string
        }
        Relationships: []
      }
      canjes_puntos: {
        Row: {
          cajero_id: string | null
          cliente_id: string
          created_at: string
          estado: string
          factura_id: string | null
          id: string
          notas: string | null
          premio_id: string
          puntos_usados: number
        }
        Insert: {
          cajero_id?: string | null
          cliente_id: string
          created_at?: string
          estado?: string
          factura_id?: string | null
          id?: string
          notas?: string | null
          premio_id: string
          puntos_usados: number
        }
        Update: {
          cajero_id?: string | null
          cliente_id?: string
          created_at?: string
          estado?: string
          factura_id?: string | null
          id?: string
          notas?: string | null
          premio_id?: string
          puntos_usados?: number
        }
        Relationships: [
          {
            foreignKeyName: "canjes_puntos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_puntos_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_puntos_premio_id_fkey"
            columns: ["premio_id"]
            isOneToOne: false
            referencedRelation: "premios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      categorias_gastos: {
        Row: {
          activa: boolean | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          tipo: string
        }
        Insert: {
          activa?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          tipo?: string
        }
        Update: {
          activa?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
      cierres_caja: {
        Row: {
          cajero_id: string | null
          created_at: string
          diferencia: number
          efectivo_final: number
          efectivo_inicial: number
          fecha: string
          id: string
          notas: string | null
          total_daviplata: number
          total_efectivo: number
          total_nequi: number
          total_tarjeta_credito: number
          total_tarjeta_debito: number
          total_ventas: number
        }
        Insert: {
          cajero_id?: string | null
          created_at?: string
          diferencia?: number
          efectivo_final?: number
          efectivo_inicial?: number
          fecha?: string
          id?: string
          notas?: string | null
          total_daviplata?: number
          total_efectivo?: number
          total_nequi?: number
          total_tarjeta_credito?: number
          total_tarjeta_debito?: number
          total_ventas?: number
        }
        Update: {
          cajero_id?: string | null
          created_at?: string
          diferencia?: number
          efectivo_final?: number
          efectivo_inicial?: number
          fecha?: string
          id?: string
          notas?: string | null
          total_daviplata?: number
          total_efectivo?: number
          total_nequi?: number
          total_tarjeta_credito?: number
          total_tarjeta_debito?: number
          total_ventas?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          apellido: string | null
          cedula: string | null
          celular: string | null
          correo: string | null
          created_at: string
          id: string
          nombre: string | null
          updated_at: string
        }
        Insert: {
          apellido?: string | null
          cedula?: string | null
          celular?: string | null
          correo?: string | null
          created_at?: string
          id?: string
          nombre?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string | null
          cedula?: string | null
          celular?: string | null
          correo?: string | null
          created_at?: string
          id?: string
          nombre?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracion_restaurante: {
        Row: {
          created_at: string
          direccion: string | null
          facebook: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          nombre: string
          pagina_web: string | null
          telefono: string | null
          tiene_domicilios: boolean | null
          tiktok: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nombre: string
          pagina_web?: string | null
          telefono?: string | null
          tiene_domicilios?: boolean | null
          tiktok?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nombre?: string
          pagina_web?: string | null
          telefono?: string | null
          tiene_domicilios?: boolean | null
          tiktok?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cuentas_flujo: {
        Row: {
          activa: boolean | null
          color: string | null
          created_at: string
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          saldo_actual: number
          saldo_inicial: number
          tipo: string
          updated_at: string
        }
        Insert: {
          activa?: boolean | null
          color?: string | null
          created_at?: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          saldo_actual?: number
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          activa?: boolean | null
          color?: string | null
          created_at?: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          saldo_actual?: number
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      factura_items: {
        Row: {
          cantidad: number
          created_at: string
          factura_id: string
          id: string
          orden_producto_id: string | null
          precio_unitario: number
          producto_nombre: string
          subtotal: number
        }
        Insert: {
          cantidad: number
          created_at?: string
          factura_id: string
          id?: string
          orden_producto_id?: string | null
          precio_unitario: number
          producto_nombre: string
          subtotal: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          factura_id?: string
          id?: string
          orden_producto_id?: string | null
          precio_unitario?: number
          producto_nombre?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "factura_items_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factura_items_orden_producto_id_fkey"
            columns: ["orden_producto_id"]
            isOneToOne: false
            referencedRelation: "orden_productos"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          cajero_id: string | null
          cliente_id: string | null
          consecutivo: number
          created_at: string
          id: string
          impuestos: number
          metodo_pago: string | null
          nombre_cliente: string
          orden_id: string | null
          propina: number | null
          referencia_pago: string | null
          subtotal: number
          total: number
        }
        Insert: {
          cajero_id?: string | null
          cliente_id?: string | null
          consecutivo?: number
          created_at?: string
          id?: string
          impuestos: number
          metodo_pago?: string | null
          nombre_cliente: string
          orden_id?: string | null
          propina?: number | null
          referencia_pago?: string | null
          subtotal: number
          total: number
        }
        Update: {
          cajero_id?: string | null
          cliente_id?: string | null
          consecutivo?: number
          created_at?: string
          id?: string
          impuestos?: number
          metodo_pago?: string | null
          nombre_cliente?: string
          orden_id?: string | null
          propina?: number | null
          referencia_pago?: string | null
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_recurrentes: {
        Row: {
          activo: boolean | null
          categoria_gasto_id: string | null
          created_at: string
          dia_pago: number | null
          frecuencia: string
          id: string
          monto_estimado: number
          nombre: string
          notas: string | null
          proximo_pago: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          categoria_gasto_id?: string | null
          created_at?: string
          dia_pago?: number | null
          frecuencia?: string
          id?: string
          monto_estimado: number
          nombre: string
          notas?: string | null
          proximo_pago?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          categoria_gasto_id?: string | null
          created_at?: string
          dia_pago?: number | null
          frecuencia?: string
          id?: string
          monto_estimado?: number
          nombre?: string
          notas?: string | null
          proximo_pago?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_recurrentes_categoria_gasto_id_fkey"
            columns: ["categoria_gasto_id"]
            isOneToOne: false
            referencedRelation: "categorias_gastos"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos_restaurante: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          peso_estandar: number | null
          precio_referencia: number | null
          stock_actual: number | null
          stock_minimo: number | null
          tipo_insumo_id: string | null
          unidad_medida: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          peso_estandar?: number | null
          precio_referencia?: number | null
          stock_actual?: number | null
          stock_minimo?: number | null
          tipo_insumo_id?: string | null
          unidad_medida?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          peso_estandar?: number | null
          precio_referencia?: number | null
          stock_actual?: number | null
          stock_minimo?: number | null
          tipo_insumo_id?: string | null
          unidad_medida?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insumos_restaurante_tipo_insumo_id_fkey"
            columns: ["tipo_insumo_id"]
            isOneToOne: false
            referencedRelation: "tipos_insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_entradas: {
        Row: {
          cantidad: number
          created_at: string
          fecha_ingreso: string
          fecha_vencimiento: string | null
          id: string
          lote: string | null
          notas: string | null
          precio_compra: number
          producto_id: string | null
          proveedor_id: string | null
          registrado_por: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          fecha_ingreso?: string
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          notas?: string | null
          precio_compra: number
          producto_id?: string | null
          proveedor_id?: string | null
          registrado_por?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          fecha_ingreso?: string
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          notas?: string | null
          precio_compra?: number
          producto_id?: string | null
          proveedor_id?: string | null
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_entradas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_entradas_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_entradas_insumos: {
        Row: {
          cantidad: number
          created_at: string
          fecha_compra: string
          fecha_vencimiento: string | null
          id: string
          insumo_id: string
          lote: string | null
          notas: string | null
          peso: number | null
          precio_compra: number
          proveedor_id: string | null
          registrado_por: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          fecha_compra?: string
          fecha_vencimiento?: string | null
          id?: string
          insumo_id: string
          lote?: string | null
          notas?: string | null
          peso?: number | null
          precio_compra: number
          proveedor_id?: string | null
          registrado_por?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          fecha_compra?: string
          fecha_vencimiento?: string | null
          id?: string
          insumo_id?: string
          lote?: string | null
          notas?: string | null
          peso?: number | null
          precio_compra?: number
          proveedor_id?: string | null
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_entradas_insumos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos_restaurante"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_entradas_insumos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_stock: {
        Row: {
          cantidad_actual: number
          cantidad_minima: number | null
          id: string
          producto_id: string
          ultima_actualizacion: string
        }
        Insert: {
          cantidad_actual?: number
          cantidad_minima?: number | null
          id?: string
          producto_id: string
          ultima_actualizacion?: string
        }
        Update: {
          cantidad_actual?: number
          cantidad_minima?: number | null
          id?: string
          producto_id?: string
          ultima_actualizacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: true
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      mesas: {
        Row: {
          capacidad_sillas: number
          created_at: string
          disponible: boolean | null
          id: string
          numero: number
          salon_id: string
        }
        Insert: {
          capacidad_sillas: number
          created_at?: string
          disponible?: boolean | null
          id?: string
          numero: number
          salon_id: string
        }
        Update: {
          capacidad_sillas?: number
          created_at?: string
          disponible?: boolean | null
          id?: string
          numero?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesas_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salones"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_caja: {
        Row: {
          aprobado_por: string | null
          categoria_gasto_id: string | null
          comprobante_url: string | null
          created_at: string
          cuenta_id: string | null
          descripcion: string
          estado: Database["public"]["Enums"]["estado_movimiento"]
          fecha_movimiento: string
          id: string
          monto: number
          notas: string | null
          registrado_por: string
          tipo: Database["public"]["Enums"]["tipo_movimiento_caja"]
          updated_at: string
        }
        Insert: {
          aprobado_por?: string | null
          categoria_gasto_id?: string | null
          comprobante_url?: string | null
          created_at?: string
          cuenta_id?: string | null
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_movimiento"]
          fecha_movimiento?: string
          id?: string
          monto: number
          notas?: string | null
          registrado_por: string
          tipo: Database["public"]["Enums"]["tipo_movimiento_caja"]
          updated_at?: string
        }
        Update: {
          aprobado_por?: string | null
          categoria_gasto_id?: string | null
          comprobante_url?: string | null
          created_at?: string
          cuenta_id?: string | null
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_movimiento"]
          fecha_movimiento?: string
          id?: string
          monto?: number
          notas?: string | null
          registrado_por?: string
          tipo?: Database["public"]["Enums"]["tipo_movimiento_caja"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_caja_categoria_gasto_id_fkey"
            columns: ["categoria_gasto_id"]
            isOneToOne: false
            referencedRelation: "categorias_gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas_flujo"
            referencedColumns: ["id"]
          },
        ]
      }
      orden_productos: {
        Row: {
          cantidad: number
          created_at: string
          facturado: boolean | null
          id: string
          notas: string | null
          numero_silla: number
          orden_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Insert: {
          cantidad?: number
          created_at?: string
          facturado?: boolean | null
          id?: string
          notas?: string | null
          numero_silla: number
          orden_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          facturado?: boolean | null
          id?: string
          notas?: string | null
          numero_silla?: number
          orden_id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "orden_productos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_productos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes: {
        Row: {
          cocinero_id: string | null
          created_at: string
          es_domicilio: boolean | null
          estado: Database["public"]["Enums"]["estado_orden"]
          id: string
          instrucciones_entrega: string | null
          mesa_id: string | null
          mesero_id: string | null
          nombre_cliente: string | null
          numero_orden: number
          total: number | null
          turno: Database["public"]["Enums"]["turno"]
          updated_at: string
        }
        Insert: {
          cocinero_id?: string | null
          created_at?: string
          es_domicilio?: boolean | null
          estado?: Database["public"]["Enums"]["estado_orden"]
          id?: string
          instrucciones_entrega?: string | null
          mesa_id?: string | null
          mesero_id?: string | null
          nombre_cliente?: string | null
          numero_orden?: number
          total?: number | null
          turno: Database["public"]["Enums"]["turno"]
          updated_at?: string
        }
        Update: {
          cocinero_id?: string | null
          created_at?: string
          es_domicilio?: boolean | null
          estado?: Database["public"]["Enums"]["estado_orden"]
          id?: string
          instrucciones_entrega?: string | null
          mesa_id?: string | null
          mesero_id?: string | null
          nombre_cliente?: string | null
          numero_orden?: number
          total?: number | null
          turno?: Database["public"]["Enums"]["turno"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      premios: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          nombre: string
          producto_id: string | null
          puntos_requeridos: number
          stock: number | null
          tipo: string
          updated_at: string
          valor_descuento: number | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre: string
          producto_id?: string | null
          puntos_requeridos: number
          stock?: number | null
          tipo?: string
          updated_at?: string
          valor_descuento?: number | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          producto_id?: string | null
          puntos_requeridos?: number
          stock?: number | null
          tipo?: string
          updated_at?: string
          valor_descuento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "premios_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria_id: string | null
          created_at: string
          descripcion: string | null
          disponible: boolean | null
          foto_url: string | null
          id: string
          nombre: string
          precio: number
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          descripcion?: string | null
          disponible?: boolean | null
          foto_url?: string | null
          id?: string
          nombre: string
          precio: number
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          descripcion?: string | null
          disponible?: boolean | null
          foto_url?: string | null
          id?: string
          nombre?: string
          precio?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellido: string
          correo: string | null
          created_at: string
          direccion: string | null
          foto_url: string | null
          id: string
          nombre: string
          sede_id: string | null
          telefono: string | null
          turno: Database["public"]["Enums"]["turno"] | null
          updated_at: string
        }
        Insert: {
          apellido: string
          correo?: string | null
          created_at?: string
          direccion?: string | null
          foto_url?: string | null
          id: string
          nombre: string
          sede_id?: string | null
          telefono?: string | null
          turno?: Database["public"]["Enums"]["turno"] | null
          updated_at?: string
        }
        Update: {
          apellido?: string
          correo?: string | null
          created_at?: string
          direccion?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          sede_id?: string | null
          telefono?: string | null
          turno?: Database["public"]["Enums"]["turno"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean | null
          correo: string | null
          created_at: string
          direccion: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          correo?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          correo?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      puntos_cliente: {
        Row: {
          cliente_id: string
          created_at: string
          factura_id: string
          id: string
          monto_factura: number
          puntos_otorgados: number
          turno: Database["public"]["Enums"]["turno"]
        }
        Insert: {
          cliente_id: string
          created_at?: string
          factura_id: string
          id?: string
          monto_factura: number
          puntos_otorgados?: number
          turno: Database["public"]["Enums"]["turno"]
        }
        Update: {
          cliente_id?: string
          created_at?: string
          factura_id?: string
          id?: string
          monto_factura?: number
          puntos_otorgados?: number
          turno?: Database["public"]["Enums"]["turno"]
        }
        Relationships: [
          {
            foreignKeyName: "puntos_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_cliente_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: true
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      puntos_configuracion: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string | null
          id: string
          monto_base: number
          puntos_por_peso: number
          turno: Database["public"]["Enums"]["turno"]
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          monto_base?: number
          puntos_por_peso?: number
          turno: Database["public"]["Enums"]["turno"]
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          monto_base?: number
          puntos_por_peso?: number
          turno?: Database["public"]["Enums"]["turno"]
          updated_at?: string
        }
        Relationships: []
      }
      salones: {
        Row: {
          created_at: string
          id: string
          nombre: string
          sede_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          sede_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          sede_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salones_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      sedes: {
        Row: {
          activa: boolean | null
          correo: string | null
          created_at: string
          dias_operacion: string[] | null
          direccion: string | null
          horario_apertura: string | null
          horario_cierre: string | null
          id: string
          logo_url: string | null
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activa?: boolean | null
          correo?: string | null
          created_at?: string
          dias_operacion?: string[] | null
          direccion?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activa?: boolean | null
          correo?: string | null
          created_at?: string
          dias_operacion?: string[] | null
          direccion?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tipos_insumos: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      transferencias_cuentas: {
        Row: {
          created_at: string
          cuenta_destino_id: string
          cuenta_origen_id: string
          descripcion: string | null
          id: string
          monto: number
          notas: string | null
          registrado_por: string
        }
        Insert: {
          created_at?: string
          cuenta_destino_id: string
          cuenta_origen_id: string
          descripcion?: string | null
          id?: string
          monto: number
          notas?: string | null
          registrado_por: string
        }
        Update: {
          created_at?: string
          cuenta_destino_id?: string
          cuenta_origen_id?: string
          descripcion?: string | null
          id?: string
          monto?: number
          notas?: string | null
          registrado_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_cuentas_cuenta_destino_id_fkey"
            columns: ["cuenta_destino_id"]
            isOneToOne: false
            referencedRelation: "cuentas_flujo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_cuentas_cuenta_origen_id_fkey"
            columns: ["cuenta_origen_id"]
            isOneToOne: false
            referencedRelation: "cuentas_flujo"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      reset_orden_counter: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "admin_total"
        | "admin_sede"
        | "cajero"
        | "mesero"
        | "cocina"
        | "mesero_externo"
      estado_movimiento: "pendiente" | "aprobado" | "rechazado"
      estado_orden: "recibida" | "tomada" | "entregada" | "facturada"
      tipo_movimiento_caja: "entrada" | "salida" | "reposicion"
      turno: "manana" | "tarde" | "noche"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin_total",
        "admin_sede",
        "cajero",
        "mesero",
        "cocina",
        "mesero_externo",
      ],
      estado_movimiento: ["pendiente", "aprobado", "rechazado"],
      estado_orden: ["recibida", "tomada", "entregada", "facturada"],
      tipo_movimiento_caja: ["entrada", "salida", "reposicion"],
      turno: ["manana", "tarde", "noche"],
    },
  },
} as const
