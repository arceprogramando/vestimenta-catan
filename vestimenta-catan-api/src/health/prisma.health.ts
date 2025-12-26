import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Health Indicator para Prisma/PostgreSQL
 *
 * Verifica la conexión a la base de datos ejecutando una query simple.
 * Usado por el endpoint /health/ready para determinar si la app
 * puede recibir tráfico.
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Verifica que la base de datos esté accesible
   *
   * @param key - Nombre del indicador en la respuesta (ej: 'database')
   * @param timeoutMs - Timeout en milisegundos (default: 3000)
   * @returns HealthIndicatorResult con status 'up' o 'down'
   * @throws HealthCheckError si la BD no responde
   */
  async isHealthy(
    key: string,
    timeoutMs: number = 3000,
  ): Promise<HealthIndicatorResult> {
    try {
      // Ejecutar query simple con timeout
      const startTime = Date.now();

      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), timeoutMs),
        ),
      ]);

      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, { responseTime: `${responseTime}ms` });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error';

      throw new HealthCheckError(
        `${key} health check failed`,
        this.getStatus(key, false, { error: errorMessage }),
      );
    }
  }
}
