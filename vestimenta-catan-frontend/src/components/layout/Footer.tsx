import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <ShoppingBag className="h-6 w-6" />
              <span className="font-bold text-xl">Vestimenta Catán</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Ropa térmica de calidad para toda la familia.
            </p>
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
                <Link href="/productos?genero=ninos" className="hover:text-primary">
                  Niños
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold mb-4">Mi Cuenta</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
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
              <li>San Martín de los Andes</li>
              <li>Neuquén, Argentina</li>
              <li>info@vestimentacatan.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Vestimenta Catán. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
