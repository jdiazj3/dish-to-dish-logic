import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Image as ImageIcon, Check } from "lucide-react";
import { formatCOP } from "@/utils/formatCurrency";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export function ProductoPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("all");

  const { data: categorias } = useQuery({
    queryKey: ["categorias-picker"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias").select("id, nombre").order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const { data: productos } = useQuery({
    queryKey: ["productos-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio, foto_url, categoria_id")
        .eq("disponible", true)
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const filtrados = useMemo(() => {
    return (productos || []).filter((p) => {
      const matchNombre = p.nombre.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoriaId === "all" || p.categoria_id === categoriaId;
      return matchNombre && matchCat;
    });
  }, [productos, search, categoriaId]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {categorias && categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Badge
            variant={categoriaId === "all" ? "default" : "outline"}
            className="cursor-pointer shrink-0"
            onClick={() => setCategoriaId("all")}
          >
            Todas
          </Badge>
          {categorias.map((c) => (
            <Badge
              key={c.id}
              variant={categoriaId === c.id ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setCategoriaId(c.id)}
            >
              {c.nombre}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
        {filtrados.map((p) => {
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={cn(
                "relative text-left rounded-lg overflow-hidden border transition-all bg-card hover:shadow-md",
                selected ? "border-primary ring-2 ring-primary" : "border-border"
              )}
            >
              <div className="aspect-square bg-muted flex items-center justify-center">
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
                {selected && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium line-clamp-2 leading-tight">{p.nombre}</p>
                <p className="text-xs text-primary font-bold mt-1">{formatCOP(Number(p.precio))}</p>
              </div>
            </button>
          );
        })}
        {filtrados.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-6">
            No hay productos
          </p>
        )}
      </div>
    </div>
  );
}
