'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { InstagramIcon, WhatsAppIcon, MercadoPagoIcon } from '@/components/icons/SocialIcons';

// Numero de WhatsApp (sin el + ni espacios)
const WHATSAPP_NUMBER = '5491150990913';
const WHATSAPP_MESSAGE = 'Hola buenas, estaria interesado en conocer mas acerca de tus prendas';
const MERCADOPAGO_URL = 'https://link.mercadopago.com.ar/f12345678';

export function Footer() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // No mostrar Footer en rutas de admin
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <ShoppingBag className="h-6 w-6" />
              <span className="font-bold text-xl">Vestimenta Catan</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Ropa termica de calidad para toda la familia.
            </p>
            {/* Redes sociales */}
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/vestimenta.catan/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-7 w-7" />
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-7 w-7" />
              </a>
              <a
                href={MERCADOPAGO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="MercadoPago"
              >
                <MercadoPagoIcon className="h-7 w-7" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Productos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/productos?genero=hombre" className="hover:text-primary">
                  Hombre
                </Link>
              </li>
              <li>
                <Link href="/productos?genero=mujer" className="hover:text-primary">
                  Mujer
                </Link>
              </li>
              <li>
                <Link href="/productos?genero=ninios" className="hover:text-primary">
                  Ninos
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold mb-4">Mi Cuenta</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {!isAuthenticated && (
                <>
                  <li>
                    <Link href="/login" className="hover:text-primary">
                      Ingresar
                    </Link>
                  </li>
                  <li>
                    <Link href="/registro" className="hover:text-primary">
                      Registrarse
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link href="/mis-reservas" className="hover:text-primary">
                  Mis Reservas
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Gonzalez Catan, Buenos Aires<br />
                  Argentina
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Vestimenta Catan. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
