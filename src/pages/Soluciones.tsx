import { Link } from "react-router-dom";
import { ArrowRight, Check, X } from "lucide-react";
import PublicShell from "@/components/home/PublicShell";
import { modulos } from "@/data/modulosDiferenciales";

export default function Soluciones() {
  return (
    <PublicShell title="Soluciones | Ancestrale Cloud">
      <section className="bg-card text-card-foreground py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-accent uppercase tracking-widest text-xs font-semibold">Lo que otros sistemas no tienen</p>
          <h1 className="mt-4 text-4xl sm:text-6xl font-bold max-w-3xl leading-tight">Todo para administrar tu restaurante, en un solo lugar.</h1>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulos.map(({ slug, icon: Icon, nombre, titular, resumen }) => (
            <Link key={slug} to={`/soluciones/${slug}`} className="group border border-border p-7 hover:bg-muted transition-colors">
              <Icon className="size-8 text-primary" />
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{nombre}</p>
              <h2 className="mt-2 text-xl font-semibold">{titular}</h2>
              <p className="mt-3 text-muted-foreground">{resumen}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-primary font-medium">Ver más <ArrowRight className="size-4" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold">Comparativa completa</h2>
          <div className="mt-8 overflow-x-auto bg-background rounded-table">
            <table className="w-full text-left min-w-[520px]">
              <thead><tr className="border-b border-border text-sm text-muted-foreground"><th className="p-4 font-medium">Módulo</th><th className="p-4 font-medium">Función</th><th className="p-4 font-medium text-center">Otros</th><th className="p-4 font-medium text-center">Ancestrale</th></tr></thead>
              <tbody>
                {modulos.flatMap(m => m.comparativa.map((c, i) => (
                  <tr key={m.slug + c.item} className="border-b border-border">
                    <td className="p-4 font-medium">{i === 0 ? m.nombre : ""}</td>
                    <td className="p-4">{c.item}</td>
                    <td className="p-4 text-center">{c.otros ? <Check className="inline size-5 text-muted-foreground" aria-label="Sí" /> : <X className="inline size-5 text-destructive" aria-label="No" />}</td>
                    <td className="p-4 text-center"><Check className="inline size-5 text-primary" aria-label="Sí" /></td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
