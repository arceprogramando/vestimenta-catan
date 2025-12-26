import {
  Module,
  Global,
  MiddlewareConsumer,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditService } from './audit.service';
import { AuditContextMiddleware } from './audit.middleware';
import { setAuditService } from './audit.extension';

/**
 * AuditModule - Módulo global de auditoría
 *
 * Provee:
 * - AuditService: Servicio para registrar y consultar logs
 * - AuditContextMiddleware: Inyecta contexto de usuario en requests
 * - Integración con Prisma via extension
 *
 * El módulo es global para que AuditService esté disponible
 * en toda la aplicación sin necesidad de importarlo.
 */
@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [AuditService, AuditContextMiddleware],
  exports: [AuditService],
})
export class AuditModule implements NestModule, OnModuleInit {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Configura el middleware de contexto de auditoría
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }

  /**
   * Inyecta el servicio de auditoría en la extensión de Prisma
   */
  onModuleInit() {
    setAuditService(this.auditService);
  }
}
