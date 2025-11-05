import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChefHat } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

const signupSchema = loginSchema.extend({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  apellido: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
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
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-glow">
              <ChefHat className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Ancestrale</CardTitle>
          <CardDescription>
            {isLogin ? "Inicia sesión en tu cuenta" : "Crea una nueva cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
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

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-primary hover:underline"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
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
                  <Label htmlFor="apellido">Apellido</Label>
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
                <Label htmlFor="signup-email">Correo electrónico</Label>
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
                <Label htmlFor="signup-password">Contraseña</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  {...signupForm.register("password")}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  {...signupForm.register("confirmPassword")}
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={signupForm.formState.isSubmitting}
              >
                {signupForm.formState.isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:underline"
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
