'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, ShoppingBag, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

const navigation = [
  { name: 'Productos', href: '/productos' },
  { name: 'Hombre', href: '/productos?genero=hombre' },
  { name: 'Mujer', href: '/productos?genero=mujer' },
  { name: 'Niños', href: '/productos?genero=ninios' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isHydrated, logout, fullName, isAdmin } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.split('?')[0]);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/');
  };

  const getInitials = () => {
    if (!user) return 'U';
    if (user.nombre) {
      return `${user.nombre[0]}${user.apellido?.[0] || ''}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 z-10">
            <ShoppingBag className="h-6 w-6" />
            <span className="font-bold text-xl hidden sm:inline-block">
              Vestimenta Catan
            </span>
            <span className="font-bold text-xl sm:hidden">VC</span>
          </Link>

          {/* Desktop Navigation - Centered Absolutely */}
          <nav className="hidden md:flex items-center justify-center space-x-6 absolute left-1/2 -translate-x-1/2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth/User */}
          <div className="hidden md:flex items-center space-x-4">
            {!isHydrated ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      {isAdmin && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded w-fit">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/perfil">Mi Perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mis-reservas">Mis Reservas</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Ingresar
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/registro">Registrarse</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-75 sm:w-100">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5" />
                  <span>Vestimenta Catan</span>
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-primary p-2 rounded-md ${
                      isActive(item.href)
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="absolute bottom-8 left-6 right-6">
                {isAuthenticated && user ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/perfil">Mi Perfil</Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/mis-reservas">Mis Reservas</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesion
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Ingresar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/registro">Registrarse</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
