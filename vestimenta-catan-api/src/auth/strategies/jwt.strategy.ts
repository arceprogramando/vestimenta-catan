import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
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
 * Estrategia para validar JWT Access Tokens
 * - Extrae el token del header Authorization: Bearer <token>
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
