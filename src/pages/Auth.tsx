import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChefHat, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

const signupSchema = loginSchema.extend({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }).max(50, { message: "El nombre no puede exceder 50 caracteres" }),
  apellido: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres" }).max(50, { message: "El apellido no puede exceder 50 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function Auth() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const resetPasswordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const handleLogin = async (data: LoginForm) => {
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      toast.error("Error al iniciar sesión", {
        description: error.message === "Invalid login credentials" 
          ? "Credenciales inválidas. Verifica tu correo y contraseña."
          : error.message
      });
      return;
    }

    toast.success("¡Bienvenido a Ancestrale!");
    navigate("/");
  };

  const handleSignup = async (data: SignupForm) => {
    const { error } = await signUp(data.email, data.password, data.nombre, data.apellido);
    
    if (error) {
      toast.error("Error al registrarse", {
        description: error.message === "User already registered"
          ? "Este correo ya está registrado."
          : error.message
      });
      return;
    }

    toast.success("Cuenta creada exitosamente", {
      description: "Ya puedes iniciar sesión"
    });
    setActiveTab("login");
    signupForm.reset();
  };

  const handleResetPassword = async (data: ResetPasswordForm) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    
    if (error) {
      toast.error("Error al enviar correo", {
        description: error.message
      });
      return;
    }

    toast.success("Correo enviado", {
      description: "Revisa tu correo para restablecer tu contraseña"
    });
    resetPasswordForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg ring-4 ring-primary/20">
              <ChefHat className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Ancestrale
          </CardTitle>
          <CardDescription className="text-base">
            Sistema de gestión restaurante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
              <TabsTrigger value="reset">Recuperar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setActiveTab("reset")}
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      placeholder="Juan"
                      {...signupForm.register("nombre")}
                    />
                    {signupForm.formState.errors.nombre && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.nombre.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      placeholder="Pérez"
                      {...signupForm.register("apellido")}
                    />
                    {signupForm.formState.errors.apellido && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.apellido.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo electrónico *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@email.com"
                    {...signupForm.register("email")}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    {...signupForm.register("password")}
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña *</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repite tu contraseña"
                    {...signupForm.register("confirmPassword")}
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={signupForm.formState.isSubmitting}
                >
                  {signupForm.formState.isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  * Campos obligatorios
                </p>
              </form>
            </TabsContent>

            <TabsContent value="reset">
              <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">Recuperar contraseña</h3>
                  <p className="text-sm text-muted-foreground">
                    Te enviaremos un enlace para restablecer tu contraseña
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-email">Correo electrónico</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@email.com"
                    {...resetPasswordForm.register("email")}
                  />
                  {resetPasswordForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{resetPasswordForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={resetPasswordForm.formState.isSubmitting}
                >
                  {resetPasswordForm.formState.isSubmitting ? "Enviando..." : "Enviar enlace"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-sm text-primary hover:underline"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
