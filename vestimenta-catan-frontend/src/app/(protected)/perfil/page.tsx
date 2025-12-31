'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Calendar, LogOut, Shield, Loader2 } from 'lucide-react';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';

export default function PerfilPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { isHydrated } = useRequireAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Loading mientras se hidrata o verifica auth
  if (!isHydrated || isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth redirige a login
  }

  const initials = `${user.nombre?.[0] || ''}${user.apellido?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.nombre || 'Avatar'} />}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">
            {user.nombre || 'Usuario'} {user.apellido || ''}
          </CardTitle>
          <CardDescription>
            <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-full capitalize">
              {user.rol}
            </span>
            {user.provider === 'google' && (
              <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full ml-2">
                Google
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre completo</p>
                <p className="font-medium">{user.nombre || '-'} {user.apellido || ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Metodo de autenticacion</p>
                <p className="font-medium capitalize">{user.provider || 'Email/Password'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Miembro desde</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="destructive" onClick={handleLogout} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Cerrar Sesion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
