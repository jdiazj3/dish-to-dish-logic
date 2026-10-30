import { Link, Navigate, useParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import PublicShell from "@/components/home/PublicShell";
import { modulos } from "@/data/modulosDiferenciales";

export default function SolucionModulo() {
  const { slug } = useParams();
  const m = modulos.find(x => x.slug === slug);
  if (!m) return <Navigate to="/soluciones" replace />;
  const Icon = m.icon;
  const otros = modulos.filter(x => x.slug !== m.slug);

  return (
    <PublicShell title={`${m.nombre} | Ancestrale Cloud`}>
      <section className="bg-card text-card-foreground py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 max-w-3xl">
          <Link to="/soluciones" className="text-sm text-accent hover:underline">← Soluciones</Link>
          <div className="mt-6 flex items-center gap-3 text-accent"><Icon className="size-7 text-primary" /><span className="uppercase tracking-widest text-xs font-semibold">{m.nombre}</span></div>
          <h1 className="mt-5 text-4xl sm:text-6xl font-bold leading-tight">{m.problema}</h1>
          <p className="mt-6 text-xl text-muted-foreground">{m.promesa}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5 grid md:grid-cols-3 gap-10">
          {m.beneficios.map(b => (
            <div key={b.titulo} className="pt-5">
              <h2 className="text-xl font-semibold">{b.titulo}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold">Cómo funciona</h2>
          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {m.pasos.map((p, i) => (
              <li key={p} className="bg-background p-6 border border-border">
                <span className="text-4xl font-bold text-primary">{i + 1}</span>
                <p className="mt-3 font-medium">{p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5 grid lg:grid-cols-2 gap-14">
          <div>
            <h2 className="text-3xl font-bold">Otros sistemas vs Ancestrale Cloud</h2>
            <div className="mt-8 rounded-table bg-card px-4"><table className="w-full text-left">
              <thead><tr className="border-b border-border text-sm text-muted-foreground"><th className="py-3 font-medium">Función</th><th className="py-3 font-medium text-center">Otros</th><th className="py-3 font-medium text-center">Ancestrale</th></tr></thead>
              <tbody>
                {m.comparativa.map(c => (
                  <tr key={c.item} className="border-b border-border">
                    <td className="py-4 pr-3">{c.item}</td>
                    <td className="py-4 text-center">{c.otros ? <Check className="inline size-5 text-muted-foreground" aria-label="Sí" /> : <X className="inline size-5 text-destructive" aria-label="No" />}</td>
                    <td className="py-4 text-center"><Check className="inline size-5 text-primary" aria-label="Sí" /></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Preguntas frecuentes</h2>
            <dl className="mt-8 space-y-6">
              {m.faqs.map(f => (<div key={f.q}><dt className="font-semibold">{f.q}</dt><dd className="mt-1 text-muted-foreground">{f.a}</dd></div>))}
            </dl>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-14">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Otros módulos</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {otros.map(o => <Link key={o.slug} to={`/soluciones/${o.slug}`} className="bg-card rounded-md px-4 py-2 hover:bg-muted hover:text-primary">{o.nombre}</Link>)}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
