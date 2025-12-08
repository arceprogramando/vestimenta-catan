import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Payload del JWT Refresh Token
 */
export interface RefreshTokenPayload {
  sub: number; // userId
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Estrategia para validar JWT Refresh Tokens
 * - Extrae el token de la cookie httpOnly
 * - Valida firma y expiración
 * - Retorna el payload para generar nuevos tokens
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET no está configurado');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Primero intentar extraer de cookie
        (request: Request) => {
          const token = request?.cookies?.refreshToken;
          if (token) {
            return token;
          }
          return null;
        },
        // Fallback: extraer del header Authorization
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
      passReqToCallback: true,
    });
  }

  /**
   * Validar el refresh token y retornar el payload junto con el token
   */
  validate(
    request: Request,
    payload: RefreshTokenPayload,
  ): { payload: RefreshTokenPayload; refreshToken: string } {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Obtener el refresh token para validación adicional
    const refreshToken =
      request?.cookies?.refreshToken ||
      request.headers.authorization?.replace('Bearer ', '');

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }

    return {
      payload,
      refreshToken,
    };
  }
}
