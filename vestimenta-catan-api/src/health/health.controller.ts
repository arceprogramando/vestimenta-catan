import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaHealthIndicator } from './prisma.health';

/**
 * Health Controller - Endpoints de monitoreo
 *
 * Provee dos endpoints para orquestadores (Kubernetes, Docker, etc.):
 *
 * - /health (Liveness): "¿El proceso está vivo?"
 *   Si falla → reiniciar el contenedor
 *
 * - /health/ready (Readiness): "¿Puede recibir tráfico?"
 *   Si falla → sacar del load balancer (pero no reiniciar)
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memoryHealth: MemoryHealthIndicator,
  ) {}

  /**
   * Liveness Probe - ¿El proceso está vivo?
   *
   * Responde 200 si el proceso Node.js está corriendo.
   * No verifica dependencias externas (BD, cache, etc.)
   *
   * Usado por: Kubernetes livenessProbe, Docker HEALTHCHECK
   * Acción si falla: Reiniciar contenedor
   */
  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Verifica que el proceso esté vivo. No verifica dependencias.',
  })
  @ApiResponse({ status: 200, description: 'Proceso vivo' })
  @ApiResponse({ status: 503, description: 'Proceso no responde' })
  liveness() {
    return this.health.check([
      // Solo verifica que el proceso responda
      // No agregamos checks de BD aquí para evitar reinicio innecesario
      // si solo la BD está caída temporalmente
      () => Promise.resolve({ app: { status: 'up' } }),
    ]);
  }

  /**
   * Readiness Probe - ¿Puede recibir tráfico?
   *
   * Verifica que todas las dependencias estén disponibles:
   * - Base de datos PostgreSQL
   * - Memoria disponible (< 80% heap usado)
   *
   * Usado por: Kubernetes readinessProbe, Load Balancer health check
   * Acción si falla: Sacar del pool de tráfico (NO reiniciar)
   */
  @Get('ready')
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness check',
    description:
      'Verifica BD y memoria. Si falla, la app no debe recibir tráfico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listo para recibir tráfico',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up', responseTime: '5ms' },
          memory_heap: { status: 'up' },
        },
        details: {
          database: { status: 'up', responseTime: '5ms' },
          memory_heap: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'No puede recibir tráfico',
    schema: {
      example: {
        status: 'error',
        error: {
          database: { status: 'down', error: 'Connection refused' },
        },
        details: {
          database: { status: 'down', error: 'Connection refused' },
        },
      },
    },
  })
  readiness() {
    return this.health.check([
      // Verifica conexión a PostgreSQL (timeout 3s)
      () => this.prismaHealth.isHealthy('database', 3000),

      // Verifica que el heap no exceda 500MB (ajustar según tu server)
      // En producción típicamente 80% del límite del contenedor
      () => this.memoryHealth.checkHeap('memory_heap', 500 * 1024 * 1024), // 500MB
    ]);
  }

  /**
   * Endpoint adicional con info detallada (opcional)
   *
   * Incluye: uptime, versión, timestamp
   * Útil para debugging y dashboards
   */
  @Get('info')
  @Public()
  @ApiOperation({
    summary: 'Información del servicio',
    description: 'Retorna información detallada del estado del servicio.',
  })
  info() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      node: process.version,
    };
  }
}
