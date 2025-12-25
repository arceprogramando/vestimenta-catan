import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  createExtendedPrismaClient,
  ExtendedPrismaClient,
} from './prisma.extensions';

// Tipo interno para acceder a métodos base del cliente
type PrismaClientBase = PrismaClient & {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T>;
  $queryRaw<T>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  $executeRaw(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<number>;
};

/**
 * PrismaService moderno con Client Extensions (Prisma 2025)
 *
 * Expone un cliente extendido con:
 * - Métodos softDelete/restore en todos los modelos
 * - Campos computados (fullName, displayName, etc.)
 * - Métodos custom por modelo (confirmar, cancelar, etc.)
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client: ExtendedPrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL || '';
    const adapter = new PrismaPg({ connectionString });
    const baseClient = new PrismaClient({ adapter });
    this._client = createExtendedPrismaClient(baseClient);
  }

  /**
   * Cliente extendido con todas las extensiones
   * Uso: this.prisma.client.usuarios.softDelete({ id })
   */
  get client(): ExtendedPrismaClient {
    return this._client;
  }

  // Proxy directo a los modelos para compatibilidad con código existente
  get usuarios() {
    return this._client.usuarios;
  }
  get productos() {
    return this._client.productos;
  }
  get producto_variantes() {
    return this._client.producto_variantes;
  }
  get reservas() {
    return this._client.reservas;
  }
  get colores() {
    return this._client.colores;
  }
  get talles() {
    return this._client.talles;
  }
  get roles() {
    return this._client.roles;
  }
  get refresh_tokens() {
    return this._client.refresh_tokens;
  }
  get audit_log() {
    return this._client.audit_log;
  }

  // Métodos de transacción y query raw
  $transaction<T>(
    fn: (prisma: ExtendedPrismaClient) => Promise<T>,
  ): Promise<T> {
    return (this._client as unknown as PrismaClientBase).$transaction(
      fn as unknown as (prisma: PrismaClient) => Promise<T>,
    );
  }

  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> {
    return (this._client as unknown as PrismaClientBase).$queryRaw<T>(
      query,
      ...values,
    );
  }

  $executeRaw(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<number> {
    return (this._client as unknown as PrismaClientBase).$executeRaw(
      query,
      ...values,
    );
  }

  async onModuleInit() {
    await (this._client as unknown as PrismaClientBase).$connect();
  }

  async onModuleDestroy() {
    await (this._client as unknown as PrismaClientBase).$disconnect();
  }
}
