import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AuditEvent, AuditConfig, DEFAULT_AUDIT_CONFIG } from './audit.types';
import { prepareAuditData } from './audit.utils';

/**
 * AuditService - Servicio de auditoría con buffer en memoria
 *
 * Características:
 * - Buffer en memoria para reducir escrituras a BD
 * - Flush automático por tiempo e intervalo
 * - Escritura asíncrona (no bloquea requests)
 * - Limpieza automática de logs antiguos
 * - Cliente Prisma separado para evitar recursión
 */
@Injectable()
export class AuditService implements OnModuleDestroy {
  private readonly logger = new Logger(AuditService.name);
  private readonly buffer: AuditEvent[] = [];
  private readonly config: AuditConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  // Cliente Prisma separado para audit_log (evita recursión)
  private auditPrisma: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    const auditEnabled = this.configService.get<string>(
      'AUDIT_ENABLED',
      'true',
    );
    const retentionDays = this.configService.get<number>(
      'AUDIT_RETENTION_DAYS',
      90,
    );
    const databaseUrl = this.configService.getOrThrow<string>('DATABASE_URL');

    this.config = {
      ...DEFAULT_AUDIT_CONFIG,
      enabled: auditEnabled !== 'false',
      retentionDays,
    };

    // Crear cliente Prisma dedicado para auditoría
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    this.auditPrisma = new PrismaClient({ adapter });

    // Iniciar timer de flush
    this.startFlushTimer();

    this.logger.log(
      `Audit service initialized (enabled: ${this.config.enabled}, retention: ${this.config.retentionDays} days)`,
    );
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    this.stopFlushTimer();

    // Flush final antes de cerrar
    if (this.buffer.length > 0) {
      await this.flush();
    }

    await this.auditPrisma.$disconnect();
  }

  /**
   * Agrega un evento al buffer de auditoría
   * No bloquea - el flush ocurre en background
   */
  log(event: Omit<AuditEvent, 'timestamp'>): void {
    if (!this.config.enabled) return;

    const fullEvent: AuditEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.buffer.push(fullEvent);

    // Flush si el buffer está lleno
    if (this.buffer.length >= this.config.bufferSize) {
      // Fire and forget - no await
      this.flush().catch((err) =>
        this.logger.error('Error in auto-flush', err),
      );
    }
  }

  /**
   * Escribe todos los eventos del buffer a la BD
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    // Sacar eventos del buffer atómicamente
    const events = this.buffer.splice(0, this.buffer.length);

    try {
      // Preparar datos para inserción masiva
      const records = events.map((event) => {
        const datosAntes = prepareAuditData(event.datos_antes);
        const datosDespues = prepareAuditData(event.datos_despues);

        return {
          tabla: event.tabla,
          registro_id: event.registro_id,
          accion: event.accion,
          datos_antes: datosAntes
            ? (datosAntes as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          datos_despues: datosDespues
            ? (datosDespues as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          campos_modificados: event.campos_modificados,
          usuario_id: event.usuario_id,
          usuario_email: event.usuario_email,
          ip_address: event.ip_address,
          user_agent: event.user_agent?.substring(0, 500) || null,
          created_at: event.timestamp,
        };
      });

      // Inserción masiva
      await this.auditPrisma.audit_log.createMany({
        data: records,
        skipDuplicates: true,
      });

      this.logger.debug(`Flushed ${records.length} audit events to database`);
    } catch (error) {
      // En caso de error, devolver eventos al buffer
      this.buffer.unshift(...events);
      this.logger.error('Failed to flush audit events', error);
      throw error;
    }
  }

  /**
   * Limpieza automática de logs antiguos
   * Se ejecuta diariamente a las 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs(): Promise<void> {
    if (this.config.retentionDays <= 0) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    try {
      const result = await this.auditPrisma.audit_log.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate,
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `Cleaned up ${result.count} audit logs older than ${this.config.retentionDays} days`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old audit logs', error);
    }
  }

  /**
   * Obtiene estadísticas del servicio de auditoría
   */
  getStats(): {
    bufferSize: number;
    config: AuditConfig;
    isEnabled: boolean;
  } {
    return {
      bufferSize: this.buffer.length,
      config: this.config,
      isEnabled: this.config.enabled,
    };
  }

  /**
   * Consulta logs de auditoría con filtros
   */
  async queryLogs(params: {
    tabla?: string;
    registro_id?: string;
    accion?: string;
    usuario_id?: bigint;
    desde?: Date;
    hasta?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (params.tabla) where.tabla = params.tabla;
    if (params.registro_id) where.registro_id = params.registro_id;
    if (params.accion) where.accion = params.accion;
    if (params.usuario_id) where.usuario_id = params.usuario_id;

    if (params.desde || params.hasta) {
      where.created_at = {};
      if (params.desde)
        (where.created_at as Record<string, Date>).gte = params.desde;
      if (params.hasta)
        (where.created_at as Record<string, Date>).lte = params.hasta;
    }

    const [logs, total] = await Promise.all([
      this.auditPrisma.audit_log.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: params.limit || 50,
        skip: params.offset || 0,
      }),
      this.auditPrisma.audit_log.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Obtiene el historial de cambios de un registro específico
   */
  async getRecordHistory(tabla: string, registroId: string) {
    return this.auditPrisma.audit_log.findMany({
      where: {
        tabla,
        registro_id: registroId,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (!this.isShuttingDown && this.buffer.length > 0) {
        this.flush().catch((err) =>
          this.logger.error('Error in timer flush', err),
        );
      }
    }, this.config.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
