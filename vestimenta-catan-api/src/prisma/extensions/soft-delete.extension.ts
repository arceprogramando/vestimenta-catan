import { Prisma } from '@prisma/client';

/**
 * Contexto de auditoría para operaciones de soft-delete
 */
export interface AuditContext {
  userId?: string;
  userEmail?: string;
}

/**
 * Tipo base para modelos con soft-delete
 */
interface SoftDeleteModel {
  is_active: boolean;
  deleted_at: Date | null;
  deleted_by: string | null;
  delete_reason: string | null;
  updated_at: Date;
}

/**
 * Extensión para soft-delete automático en todos los modelos
 * Agrega métodos: softDelete(), restore(), exists(), findManyActive()
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  model: {
    $allModels: {
      async softDelete<T, A>(
        this: T,
        args: {
          where: Prisma.Args<T, 'update'>['where'];
          context?: AuditContext;
        },
      ): Promise<Prisma.Result<T, A, 'update'>> {
        const context = Prisma.getExtensionContext(this);
        const { where, context: auditCtx } = args;

        return (
          context as unknown as {
            update: (args: unknown) => Promise<Prisma.Result<T, A, 'update'>>;
          }
        ).update({
          where,
          data: {
            is_active: false,
            deleted_at: new Date(),
            deleted_by: auditCtx?.userEmail ?? null,
            updated_at: new Date(),
          } as Partial<SoftDeleteModel>,
        });
      },

      async restore<T, A>(
        this: T,
        args: {
          where: Prisma.Args<T, 'update'>['where'];
        },
      ): Promise<Prisma.Result<T, A, 'update'>> {
        const context = Prisma.getExtensionContext(this);

        return (
          context as unknown as {
            update: (args: unknown) => Promise<Prisma.Result<T, A, 'update'>>;
          }
        ).update({
          where: args.where,
          data: {
            is_active: true,
            deleted_at: null,
            deleted_by: null,
            delete_reason: null,
            updated_at: new Date(),
          } as Partial<SoftDeleteModel>,
        });
      },

      async exists<T>(
        this: T,
        where: Prisma.Args<T, 'findFirst'>['where'],
      ): Promise<boolean> {
        const context = Prisma.getExtensionContext(this);
        const result = await (
          context as unknown as {
            findFirst: (args: { where: typeof where }) => Promise<unknown>;
          }
        ).findFirst({ where });
        return result !== null;
      },

      async findManyActive<T, A>(
        this: T,
        args?: Prisma.Args<T, 'findMany'>,
      ): Promise<Prisma.Result<T, A, 'findMany'>> {
        const context = Prisma.getExtensionContext(this);
        const whereClause = (args?.where ?? {}) as Record<string, unknown>;

        return (
          context as unknown as {
            findMany: (
              args: unknown,
            ) => Promise<Prisma.Result<T, A, 'findMany'>>;
          }
        ).findMany({
          ...args,
          where: {
            ...whereClause,
            is_active: true,
          },
        });
      },
    },
  },
});
