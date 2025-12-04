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
          consecutivo: number
          created_at: string
          id: string
          impuestos: number
          nombre_cliente: string
          orden_id: string | null
          propina: number | null
          subtotal: number
          total: number
        }
        Insert: {
          cajero_id?: string | null
          consecutivo?: number
          created_at?: string
          id?: string
          impuestos: number
          nombre_cliente: string
          orden_id?: string | null
          propina?: number | null
          subtotal: number
          total: number
        }
        Update: {
          cajero_id?: string | null
          consecutivo?: number
          created_at?: string
          id?: string
          impuestos?: number
          nombre_cliente?: string
          orden_id?: string | null
          propina?: number | null
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "facturas_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
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
      orden_productos: {
        Row: {
          cantidad: number
          created_at: string
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
          estado: Database["public"]["Enums"]["estado_orden"]
          id: string
          mesa_id: string | null
          mesero_id: string | null
          nombre_cliente: string | null
          total: number | null
          turno: Database["public"]["Enums"]["turno"]
          updated_at: string
        }
        Insert: {
          cocinero_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_orden"]
          id?: string
          mesa_id?: string | null
          mesero_id?: string | null
          nombre_cliente?: string | null
          total?: number | null
          turno: Database["public"]["Enums"]["turno"]
          updated_at?: string
        }
        Update: {
          cocinero_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_orden"]
          id?: string
          mesa_id?: string | null
          mesero_id?: string | null
          nombre_cliente?: string | null
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
    }
    Enums: {
      app_role: "admin_total" | "admin_sede" | "cajero" | "mesero" | "cocina"
      estado_orden: "recibida" | "tomada" | "entregada" | "facturada"
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
      app_role: ["admin_total", "admin_sede", "cajero", "mesero", "cocina"],
      estado_orden: ["recibida", "tomada", "entregada", "facturada"],
      turno: ["manana", "tarde", "noche"],
    },
  },
} as const
