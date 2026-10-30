import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL } from "@/data/modulosDiferenciales";

export default function PublicShell({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => { document.title = title; window.scrollTo(0, 0); }, [title]);
  return (
    <div className="public-theme min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 sticky top-0 z-20 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="size-8 bg-primary text-primary-foreground grid place-items-center rounded-sm"><UtensilsCrossed className="size-5" /></span>
            <span>Ancestrale <span className="text-primary">Cloud</span></span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-4 text-sm">
            <Link to="/soluciones" className="hidden sm:inline hover:text-primary">Soluciones</Link>
            <Button variant="ghost" size="sm" asChild><a href="/#ingresar">Ingresar</a></Button>
            <Button size="sm" asChild><a href="/#contacto">Solicitar información</a></Button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <section className="border-t border-border bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-5 flex flex-wrap items-center justify-between gap-6">
          <div><h2 className="text-2xl sm:text-3xl font-bold">¿Listo para conocerlo?</h2><p className="text-muted-foreground mt-2">Déjanos tus datos o escríbenos por WhatsApp.</p></div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="outline" asChild><a href="/#contacto">Solicitar información</a></Button>
            <Button size="lg" asChild><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><MessageCircle /> Comprar aquí</a></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
