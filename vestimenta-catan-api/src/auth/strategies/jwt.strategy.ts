import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { RequestUser } from '../decorators/current-user.decorator';

/**
 * Payload del JWT Access Token
 */
export interface JwtPayload {
  sub: number; // userId
  email: string;
  rol: string;
  iat?: number;
  exp?: number;
}

/**
 * Extrae el JWT desde la cookie httpOnly o del header Authorization
 * Prioriza la cookie para mayor seguridad
 */
const extractJwtFromCookieOrHeader = (req: Request): string | null => {
  // Primero intentar desde cookie (más seguro)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken as string;
  }

  // Fallback al header Authorization para compatibilidad
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Estrategia para validar JWT Access Tokens
 * - Extrae el token de la cookie httpOnly (prioridad) o del header Authorization
 * - Valida firma y expiración
 * - Retorna el usuario para inyectar en el request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET no está configurado');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromCookieOrHeader]),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  /**
   * Validar el payload del token y retornar el usuario
   * Este método es llamado automáticamente por Passport después de verificar el token
   */
  validate(payload: JwtPayload): RequestUser {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}
