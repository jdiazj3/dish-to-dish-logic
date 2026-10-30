import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { modulos, diaAdministrador, WHATSAPP_URL } from "@/data/modulosDiferenciales";

export default function ZonaDiferenciales() {
  return (
    <section id="diferenciales" className="scroll-mt-16 bg-card text-card-foreground py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-3xl">
          <p className="text-accent font-semibold uppercase text-xs tracking-widest">Lo que otros sistemas no tienen</p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-bold leading-tight">Mucho más que un POS: gestiona tu restaurante como un negocio.</h2>
          <p className="mt-4 text-background/75 text-lg">Ancestrale Cloud incluye módulos que normalmente pagas aparte o llevas en Excel.</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-background/15 border border-background/15">
          {modulos.map(({ slug, icon: Icon, nombre, titular, resumen }) => (
            <Link key={slug} to={`/soluciones/${slug}`} className="group bg-foreground p-7 flex flex-col hover:bg-background/5 transition-colors">
              <Icon className="size-8 text-primary" aria-hidden="true" />
              <p className="mt-5 text-xs uppercase tracking-widest text-accent">{nombre}</p>
              <h3 className="mt-2 text-xl font-semibold">{titular}</h3>
              <p className="mt-3 text-background/70 leading-relaxed flex-1">{resumen}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-primary font-medium">Ver más <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
          ))}
        </div>

        <div className="mt-20">
          <h3 className="text-2xl sm:text-3xl font-bold">Un día del administrador con Ancestrale</h3>
          <ol className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {diaAdministrador.map(({ hora, texto }) => (
              <li key={hora} className="pt-4">
                <p className="text-primary font-bold text-lg">{hora}</p>
                <p className="mt-2 text-background/80">{texto}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild><a href="/#contacto">Quiero probarlo <ArrowRight /></a></Button>
            <Button size="lg" variant="outline" className="bg-background/10 text-background border-background/50 hover:bg-background hover:text-background" asChild>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><MessageCircle /> Comprar aquí</a>
            </Button>
            <Button size="lg" variant="ghost" className="text-background hover:bg-background/10 hover:text-background" asChild><Link to="/soluciones">Ver comparativa completa</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
