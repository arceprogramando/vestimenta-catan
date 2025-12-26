import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * HealthModule - Módulo de monitoreo y health checks
 *
 * Provee endpoints para verificar el estado de la aplicación:
 * - /health - Liveness (¿proceso vivo?)
 * - /health/ready - Readiness (¿puede recibir tráfico?)
 * - /health/info - Información del servicio
 *
 * Integra con:
 * - Kubernetes (livenessProbe, readinessProbe)
 * - Docker (HEALTHCHECK)
 * - Load Balancers (AWS ALB, nginx, etc.)
 * - Monitoring (Prometheus, Datadog, etc.)
 */
@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
