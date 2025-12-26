import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { runWithAuditContext } from './audit.context';

/**
 * Middleware que inyecta el contexto de auditoría en cada request
 *
 * Extrae información del usuario autenticado y del request
 * para que esté disponible en toda la cadena de llamadas.
 */
@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extraer información del request
    const context = {
      userId: this.extractUserId(req),
      userEmail: this.extractUserEmail(req),
      ipAddress: this.extractIpAddress(req),
      userAgent: req.headers['user-agent'] || undefined,
    };

    // Ejecutar el resto del pipeline con el contexto
    runWithAuditContext(context, () => {
      next();
    });
  }

  private extractUserId(req: Request): bigint | undefined {
    // El usuario viene del JWT Guard
    const user = (req as Request & { user?: { userId?: number | bigint } })
      .user;
    if (user?.userId) {
      return typeof user.userId === 'bigint'
        ? user.userId
        : BigInt(user.userId);
    }
    return undefined;
  }

  private extractUserEmail(req: Request): string | undefined {
    const user = (req as Request & { user?: { email?: string } }).user;
    return user?.email;
  }

  private extractIpAddress(req: Request): string | undefined {
    // Manejar proxies (X-Forwarded-For)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress;
  }
}
