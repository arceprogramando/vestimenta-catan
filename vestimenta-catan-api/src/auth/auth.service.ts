import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { RefreshTokenPayload } from './strategies/jwt-refresh.strategy';

interface TokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Registrar un nuevo usuario
   */
  async register(registerDto: RegisterDto) {
    // Verificar si el email ya existe
    const existingUser = await this.usuariosService.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Crear usuario
    const user = await this.usuariosService.create({
      ...registerDto,
      rol: 'user', // Siempre crear como usuario normal
    });

    // Generar tokens
    const tokens = await this.generateTokens(user.id, user.email, user.rol);

    // Guardar refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      tokenType: 'Bearer',
      user,
    };
  }

  /**
   * Login de usuario
   */
  async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string) {
    // Buscar usuario por email
    const user = await this.usuariosService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validar contraseña
    const isPasswordValid = await this.usuariosService.validatePassword(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar tokens
    const tokens = await this.generateTokens(
      Number(user.id),
      user.email,
      user.rol,
    );

    // Guardar refresh token con metadata
    await this.saveRefreshToken(
      Number(user.id),
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    // Sanitizar usuario para respuesta
    const { password_hash, ...sanitizedUser } = user;

    return {
      ...tokens,
      tokenType: 'Bearer',
      user: {
        ...sanitizedUser,
        id: Number(sanitizedUser.id),
      },
    };
  }

  /**
   * Refrescar tokens usando el refresh token
   */
  async refreshTokens(
    userId: number,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    // Verificar que el refresh token existe y no está revocado
    const tokenHash = await this.hashToken(refreshToken);
    const storedToken = await this.prisma.refresh_tokens.findFirst({
      where: {
        usuario_id: BigInt(userId),
        token_hash: tokenHash,
        revoked: false,
        expires_at: { gt: new Date() },
      },
      include: { usuario: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Revocar el token actual (Refresh Token Rotation)
    await this.prisma.refresh_tokens.update({
      where: { id: storedToken.id },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    });

    // Generar nuevos tokens
    const tokens = await this.generateTokens(
      Number(storedToken.usuario.id),
      storedToken.usuario.email,
      storedToken.usuario.rol,
    );

    // Guardar nuevo refresh token
    await this.saveRefreshToken(
      Number(storedToken.usuario.id),
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    // Sanitizar usuario
    const { password_hash, ...sanitizedUser } = storedToken.usuario;

    return {
      ...tokens,
      tokenType: 'Bearer',
      user: {
        ...sanitizedUser,
        id: Number(sanitizedUser.id),
      },
    };
  }

  /**
   * Logout - revocar refresh token
   */
  async logout(userId: number, refreshToken: string) {
    const tokenHash = await this.hashToken(refreshToken);

    await this.prisma.refresh_tokens.updateMany({
      where: {
        usuario_id: BigInt(userId),
        token_hash: tokenHash,
        revoked: false,
      },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    });

    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Logout de todas las sesiones - revocar todos los refresh tokens
   */
  async logoutAll(userId: number) {
    await this.prisma.refresh_tokens.updateMany({
      where: {
        usuario_id: BigInt(userId),
        revoked: false,
      },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    });

    return { message: 'Todas las sesiones han sido cerradas' };
  }

  /**
   * Generar par de tokens (access + refresh)
   */
  private async generateTokens(
    userId: number,
    email: string,
    rol: string,
  ): Promise<TokensResponse> {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      rol,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      email,
    };

    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const accessExpiresInSeconds = this.parseExpiresIn(accessExpiresIn);
    const refreshExpiresInSeconds = this.parseExpiresIn(refreshExpiresIn);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresInSeconds,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresInSeconds,
      }),
    ]);

    // Usar el valor ya calculado
    const expiresIn = accessExpiresInSeconds;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Guardar refresh token en base de datos
   */
  private async saveRefreshToken(
    userId: number,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const tokenHash = await this.hashToken(refreshToken);
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresAt = new Date(
      Date.now() + this.parseExpiresIn(expiresIn) * 1000,
    );

    await this.prisma.refresh_tokens.create({
      data: {
        token_hash: tokenHash,
        usuario_id: BigInt(userId),
        expires_at: expiresAt,
        user_agent: userAgent,
        ip_address: ipAddress,
      },
    });
  }

  /**
   * Hash del token para almacenamiento seguro
   */
  private async hashToken(token: string): Promise<string> {
    // Usamos SHA256 para hash rápido (no bcrypt porque no necesitamos comparar)
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parsear string de expiración a segundos
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // 15 minutos por defecto

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }

  /**
   * Limpiar refresh tokens expirados (para job de limpieza)
   */
  async cleanupExpiredTokens() {
    const result = await this.prisma.refresh_tokens.deleteMany({
      where: {
        OR: [{ expires_at: { lt: new Date() } }, { revoked: true }],
      },
    });

    return { deleted: result.count };
  }
}
