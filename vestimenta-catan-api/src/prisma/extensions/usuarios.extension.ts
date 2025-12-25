import { Prisma } from '@prisma/client';

/**
 * Extensión para campos computados en usuarios
 */
export const usuariosExtension = Prisma.defineExtension({
  name: 'usuarios',
  result: {
    usuarios: {
      /**
       * Nombre completo del usuario (nombre + apellido)
       */
      fullName: {
        needs: { nombre: true, apellido: true },
        compute(usuario: {
          nombre: string | null;
          apellido: string | null;
        }): string | null {
          if (!usuario.nombre && !usuario.apellido) return null;
          return [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');
        },
      },

      /**
       * Indica si el usuario se registró con Google OAuth
       */
      isGoogleUser: {
        needs: { provider: true },
        compute(usuario: { provider: string }): boolean {
          return usuario.provider === 'google';
        },
      },
    },
  },
});
