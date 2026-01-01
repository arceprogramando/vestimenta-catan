'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth, useRedirectIfAuthenticated } from '@/hooks/use-auth';
import { GoogleLoginButton } from '@/app/(auth)/_components/google-login-button';
import { FormError, FormFieldError } from '@/components/form';

export default function RegistroPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const { isHydrated } = useRedirectIfAuthenticated('/');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const passwordRequirements = [
    { label: 'Minimo 8 caracteres', met: formData.password.length >= 8 },
    { label: 'Una mayuscula', met: /[A-Z]/.test(formData.password) },
    { label: 'Una minuscula', met: /[a-z]/.test(formData.password) },
    { label: 'Un numero', met: /\d/.test(formData.password) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Las contrasenas no coinciden');
      return;
    }

    if (!passwordRequirements.every(r => r.met)) {
      setLocalError('La contrasena no cumple los requisitos');
      return;
    }

    try {
      await register({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
      });
      router.push('/');
    } catch {
      // El error ya esta en el store
    }
  };

  const displayError = localError || googleError || error;

  // Mostrar loading mientras se hidrata
  if (!isHydrated) {
    return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>
          Completa tus datos para registrarte
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormError id="registro-error" message={displayError} />

          <GoogleLoginButton onError={(err) => { clearError(); setLocalError(null); setGoogleError(err); }} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O registrate con email
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Juan"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                name="apellido"
                placeholder="Perez"
                value={formData.apellido}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                aria-describedby="password-requirements"
                aria-invalid={formData.password.length > 0 && !passwordRequirements.every(r => r.met)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </Button>
            </div>

            {/* Password requirements - accesible */}
            <ul
              id="password-requirements"
              className="grid grid-cols-2 gap-2 text-xs mt-2"
              aria-label="Requisitos de contrasena"
            >
              {passwordRequirements.map((req, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-1 ${req.met ? 'text-success' : 'text-muted-foreground'}`}
                  aria-label={`${req.label}: ${req.met ? 'cumplido' : 'pendiente'}`}
                >
                  <Check className={`h-3 w-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} aria-hidden="true" />
                  <span>{req.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contrasena</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="********"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              aria-describedby={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'confirm-password-error' : undefined}
              aria-invalid={!!(formData.confirmPassword && formData.password !== formData.confirmPassword)}
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <FormFieldError id="confirm-password-error" message="Las contrasenas no coinciden" />
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrarse
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
              Inicia sesion
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
