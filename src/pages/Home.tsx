import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ChartNoAxesCombined, ChefHat, ClipboardList, Mail, MessageCircle, PackageCheck, Play, ShieldCheck, UtensilsCrossed, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import videoAsset from "@/assets/ancestrale-pos-light.mp4.asset.json";
import webmAsset from "@/assets/ancestrale-pos-web.webm.asset.json";
import posterAsset from "@/assets/ancestrale-poster.jpg.asset.json";

const schema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(100),
  celular: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/, "Escribe un celular válido"),
  email: z.string().trim().email("Escribe un correo válido").max(255),
});

const loginSchema = z.object({
  email: z.string().trim().email("Correo electrónico inválido").max(255),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const whatsapp = "https://wa.me/573025848474?text=" + encodeURIComponent("Hola, quiero conocer Ancestrale Cloud y probar el producto.");
// Local Vite preview does not proxy CDN asset paths; the hosted preview does.
const assetUrl = (path: string) => window.location.hostname === "localhost"
  ? `https://id-preview--10b72c64-ac48-437b-93d8-ec9afc000221.lovable.app${path}`
  : path;

const features = [
  { icon: ClipboardList, title: "Pedidos sin perder el ritmo", description: "Meseros y cocina comparten el estado de cada orden, desde la mesa hasta la preparación." },
  { icon: PackageCheck, title: "Inventario conectado", description: "Relaciona tus productos con insumos, compras y existencias para tener control de lo que vendes." },
  { icon: Wallet, title: "Caja bajo control", description: "Vende en mostrador, cobra mesas y consulta movimientos de caja desde un mismo lugar." },
  { icon: ChartNoAxesCombined, title: "Decisiones con números", description: "Consulta ventas, costos y rentabilidad para entender cómo marcha tu restaurante." },
];

export default function Home() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const loginForm = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [website, setWebsite] = useState("");

  const login = async (values: z.infer<typeof loginSchema>) => {
    const { error } = await signIn(values.email, values.password);
    if (error) {
      toast.error("Error al iniciar sesión", {
        description: error.message === "Invalid login credentials"
          ? "Credenciales inválidas. Verifica tu correo y contraseña."
          : error.message,
      });
      return;
    }
    navigate("/app");
  };

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse({ nombre, celular, email });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("solicitar-informacion", {
        body: { ...parsed.data, website },
      });
      if (error || !data?.success) throw new Error("No se pudo enviar la solicitud");
      setSent(true);
      setNombre(""); setCelular(""); setEmail("");
      toast.success("Solicitud enviada");
    } catch {
      toast.error("No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 sticky top-0 z-20 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
          <a href="#inicio" className="flex items-center gap-2 font-bold text-lg" aria-label="Ancestrale Cloud, inicio">
            <span className="size-8 bg-primary text-primary-foreground grid place-items-center rounded-sm"><UtensilsCrossed className="size-5" /></span>
            <span>Ancestrale <span className="text-primary">Cloud</span></span>
          </a>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-5 text-sm">
            <a href="#plataforma" className="hidden sm:inline hover:text-primary">La plataforma</a>
            <a href="#video" className="hidden sm:inline hover:text-primary">Video</a>
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" asChild><a href="#ingresar">Ingresar</a></Button>
            <Button size="sm" className="px-2 sm:px-3" asChild><a href="#contacto"><span className="sm:hidden">Contacto</span><span className="hidden sm:inline">Solicitar información</span></a></Button>
          </nav>
        </div>
      </header>

      <main>
        <section id="inicio" className="relative min-h-[610px] sm:min-h-[650px] flex items-center overflow-hidden bg-foreground text-background">
          <img src={assetUrl(posterAsset.url)} alt="Vista del panel de Ancestrale Cloud" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-foreground/75" />
          <div className="relative z-10 mx-auto max-w-6xl w-full px-5 py-20 sm:py-28">
            <div className="max-w-2xl">
              <span className="inline-block border-l-2 border-primary pl-3 text-sm font-semibold uppercase text-accent">Para restaurantes que quieren crecer</span>
              <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05]">Ancestrale Cloud</h1>
              <p className="mt-6 text-xl sm:text-2xl leading-relaxed text-background/85 max-w-xl">Tu restaurante, en una sola plataforma. Pedidos, cocina, caja, inventario y rentabilidad conectados.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button size="lg" asChild><a href="#contacto">Quiero probarlo <ArrowRight /></a></Button>
                <Button size="lg" variant="outline" className="bg-background/10 text-background border-background/50 hover:bg-background hover:text-foreground" asChild><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle /> Comprar aquí</a></Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary" />
        </section>

        <section id="ingresar" className="scroll-mt-16 border-b border-border bg-secondary py-14 sm:py-18">
          <div className="mx-auto max-w-6xl px-5 grid gap-8 md:grid-cols-[1fr_1fr] md:items-center lg:gap-20">
            <div>
              <p className="text-primary font-semibold uppercase text-xs tracking-widest">Para tu equipo</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold">Ingresa a Ancestrale Cloud.</h2>
              <p className="mt-4 text-muted-foreground text-lg">Continúa con la gestión de tu restaurante.</p>
            </div>
            <form onSubmit={loginForm.handleSubmit(login)} className="grid gap-4" aria-label="Ingresar a Ancestrale Cloud" noValidate>
              <div className="space-y-2">
                <Label htmlFor="login-email">Correo electrónico</Label>
                <Input id="login-email" type="email" autoComplete="username" maxLength={255} placeholder="tu@email.com" aria-invalid={!!loginForm.formState.errors.email} {...loginForm.register("email")} />
                {loginForm.formState.errors.email && <p role="alert" className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input id="login-password" type="password" autoComplete="current-password" placeholder="Tu contraseña" aria-invalid={!!loginForm.formState.errors.password} {...loginForm.register("password")} />
                {loginForm.formState.errors.password && <p role="alert" className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={loginForm.formState.isSubmitting} className="w-full">{loginForm.formState.isSubmitting ? "Ingresando..." : "Ingresar"} <ArrowRight /></Button>
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <Link to="/auth" className="text-primary hover:underline">Registrarse</Link>
                <Link to="/auth" className="text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
            </form>
          </div>
        </section>

        <section id="plataforma" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <div className="max-w-2xl">
              <p className="text-primary font-semibold uppercase text-xs tracking-widest">Todo conectado</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold">Del pedido al resultado.</h2>
              <p className="mt-4 text-muted-foreground text-lg">La operación diaria y los números del negocio, en el mismo lugar.</p>
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="border-t-2 border-primary pt-5">
                  <Icon className="size-7 text-primary" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="video" className="bg-secondary py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div><p className="text-primary font-semibold uppercase text-xs tracking-widest">Conoce Ancestrale Cloud</p><h2 className="mt-3 text-3xl sm:text-4xl font-bold">Míralo en acción.</h2></div>
              <p className="text-muted-foreground max-w-md">Un recorrido por los módulos de administración, meseros, cocina y caja.</p>
            </div>
            <div className="relative aspect-[16/9] overflow-hidden bg-foreground shadow-lg">
              <video ref={videoRef} className="w-full h-full object-contain" controls={started} playsInline preload="none" poster={assetUrl(posterAsset.url)} aria-label="Video de presentación de Ancestrale Cloud">
                <source src={assetUrl(webmAsset.url)} type="video/webm" />
                <source src={assetUrl(videoAsset.url)} type="video/mp4" />
              </video>
              {!started && <Button type="button" size="icon" onClick={() => { setStarted(true); void videoRef.current?.play(); }} aria-label="Reproducir video" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-16 rounded-full shadow-lg"><Play className="size-7 ml-1" /></Button>}
            </div>
          </div>
        </section>

        <section className="border-b border-border py-16">
          <div className="mx-auto max-w-6xl px-5 flex flex-wrap items-center justify-between gap-6">
            <div><h2 className="text-2xl sm:text-3xl font-bold">¿Listo para conocerlo?</h2><p className="text-muted-foreground mt-2">Hablemos de lo que necesita tu restaurante.</p></div>
            <Button size="lg" asChild><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle /> Comprar aquí</a></Button>
          </div>
        </section>

        <section id="contacto" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 grid md:grid-cols-2 gap-12 lg:gap-24">
            <div>
              <p className="text-primary font-semibold uppercase text-xs tracking-widest">Hablemos</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold">Solicita más información.</h2>
              <p className="mt-5 text-muted-foreground text-lg leading-relaxed">Déjanos tus datos y nos pondremos en contacto contigo para mostrarte cómo funciona Ancestrale Cloud.</p>
              <a href="mailto:info@ancestralecloud.top" className="inline-flex items-center gap-2 mt-8 text-primary hover:underline"><Mail className="size-5" /> info@ancestralecloud.top</a>
            </div>
            {sent ? (
              <div className="border-t-2 border-primary pt-6" role="status"><ShieldCheck className="size-9 text-success" /><h3 className="mt-4 text-2xl font-semibold">Recibimos tu solicitud</h3><p className="mt-3 text-muted-foreground">Pronto nos pondremos en contacto contigo.</p><Button variant="outline" className="mt-6" onClick={() => setSent(false)}>Enviar otra solicitud</Button></div>
            ) : (
              <form onSubmit={send} noValidate className="space-y-5" aria-label="Solicitar información">
                <div className="space-y-2"><Label htmlFor="lead-nombre">Nombre</Label><Input id="lead-nombre" autoComplete="name" maxLength={100} value={nombre} onChange={e => setNombre(e.target.value)} aria-invalid={!!errors.nombre} /><p className="text-sm text-destructive" role="alert">{errors.nombre}</p></div>
                <div className="space-y-2"><Label htmlFor="lead-celular">Celular</Label><Input id="lead-celular" type="tel" autoComplete="tel" maxLength={20} value={celular} onChange={e => setCelular(e.target.value)} aria-invalid={!!errors.celular} /><p className="text-sm text-destructive" role="alert">{errors.celular}</p></div>
                <div className="space-y-2"><Label htmlFor="lead-email">Correo electrónico</Label><Input id="lead-email" type="email" autoComplete="email" maxLength={255} value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!errors.email} /><p className="text-sm text-destructive" role="alert">{errors.email}</p></div>
                <div className="hidden" aria-hidden="true"><Label htmlFor="lead-website">Sitio web</Label><Input id="lead-website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></div>
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={sending}>{sending ? "Enviando..." : "Enviar solicitud"} <ArrowRight /></Button>
              </form>
            )}
          </div>
        </section>
      </main>
      <footer className="bg-foreground text-background py-9"><div className="mx-auto max-w-6xl px-5 flex flex-wrap justify-between gap-4 text-sm"><span className="font-semibold flex items-center gap-2"><ChefHat className="size-5 text-accent" /> Ancestrale Cloud</span><span className="text-background/70">Gestión para restaurantes · <a href="mailto:info@ancestralecloud.top" className="hover:underline">info@ancestralecloud.top</a></span></div></footer>
    </div>
  );
}
