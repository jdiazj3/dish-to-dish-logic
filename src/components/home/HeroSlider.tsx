import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { modulos } from "@/data/modulosDiferenciales";

export default function HeroSlider() {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  useEffect(() => {
    if (pausa) return;
    const t = setInterval(() => setI(v => (v + 1) % modulos.length), 4500);
    return () => clearInterval(t);
  }, [pausa]);
  const m = modulos[i];
  const Icon = m.icon;

  return (
    <div className="mt-10 max-w-xl border-l-4 border-primary bg-background/10 backdrop-blur-sm p-5" onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)} aria-roledescription="carrusel" aria-label="Funcionalidades diferenciales">
      <div key={m.slug} className="animate-fade-in" aria-live="polite">
        <div className="flex items-center gap-2 text-accent text-xs uppercase tracking-widest font-semibold">
          <Icon className="size-4 text-primary" aria-hidden="true" /> {m.nombre}
        </div>
        <p className="mt-2 text-xl sm:text-2xl font-semibold">{m.titular}</p>
        <p className="mt-1 text-background/75">{m.resumen}</p>
        <Link to={`/soluciones/${m.slug}`} className="mt-3 inline-flex items-center gap-1 text-primary font-medium hover:underline">Ver más <ArrowRight className="size-4" /></Link>
      </div>
      <div className="mt-4 flex gap-2">
        {modulos.map((x, idx) => (
          <button key={x.slug} type="button" onClick={() => setI(idx)} aria-label={`Ver ${x.nombre}`} aria-current={idx === i} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-4 bg-background/40 hover:bg-background/70"}`} />
        ))}
      </div>
    </div>
  );
}
