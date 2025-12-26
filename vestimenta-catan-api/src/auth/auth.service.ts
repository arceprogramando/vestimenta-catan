import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService, SanitizedUser } from '../usuarios/usuarios.service';
import { LoginDto, RegisterDto } from './dto';
import {
  JwtPayload,
  RefreshTokenPayload,
  TokensResponse,
} from '../common/interfaces';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

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

    // Validar contraseña (usuarios de Google no tienen password)
    if (!user.password_hash) {
      throw new UnauthorizedException(
        'Esta cuenta usa login con Google. Por favor, inicia sesion con Google.',
      );
    }

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

    return {
      ...tokens,
      tokenType: 'Bearer',
      user: {
        id: Number(user.id),
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
        provider: user.provider,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  }

  /**
   * Login con Google OAuth
   */
  async googleLogin(
    credential: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    // 1. Verificar el token de Google
    const payload = await this.verifyGoogleToken(credential);

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Token de Google invalido');
    }

    // 2. Buscar usuario por google_id
    let user: SanitizedUser | null = await this.usuariosService.findByGoogleId(
      payload.sub,
    );

    if (!user) {
      // 3. Buscar por email
      const existingUser = await this.usuariosService.findByEmail(
        payload.email,
      );

      if (existingUser) {
        // Vincular cuenta existente con Google
        user = await this.usuariosService.linkGoogleAccount(
          Number(existingUser.id),
          { sub: payload.sub, picture: payload.picture },
        );
      } else {
        // Crear nuevo usuario
        user = await this.usuariosService.createFromGoogle({
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
          given_name: payload.given_name,
          family_name: payload.family_name,
          picture: payload.picture,
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException(
        'No se pudo crear o encontrar el usuario',
      );
    }

    // 4. Generar tokens JWT
    const tokens = await this.generateTokens(
      Number(user.id),
      user.email,
      user.rol,
    );

    // 5. Guardar refresh token
    await this.saveRefreshToken(
      Number(user.id),
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    return {
      ...tokens,
      tokenType: 'Bearer',
      user,
    };
  }

  /**
   * Verificar token de Google
   */
  private async verifyGoogleToken(credential: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      return ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token de Google invalido o expirado');
    }
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
    const tokenHash = this.hashToken(refreshToken);
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

    // Verificar que el usuario asociado existe y está activo
    // Esto puede ocurrir si el usuario fue eliminado pero su token aún existe
    if (!storedToken.usuario) {
      // Revocar el token huérfano por seguridad
      await this.prisma.refresh_tokens.update({
        where: { id: storedToken.id },
        data: { revoked: true, revoked_at: new Date() },
      });
      throw new UnauthorizedException(
        'Usuario asociado al token no encontrado',
      );
    }

    // Verificar que el usuario está activo
    if (!storedToken.usuario.is_active) {
      await this.prisma.refresh_tokens.update({
        where: { id: storedToken.id },
        data: { revoked: true, revoked_at: new Date() },
      });
      throw new UnauthorizedException('Usuario desactivado');
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

    const usuario = storedToken.usuario;
    return {
      ...tokens,
      tokenType: 'Bearer',
      user: {
        id: Number(usuario.id),
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        // rol_id removido: es un detalle interno de la BD, nullable, y no documentado
        provider: usuario.provider,
        avatar_url: usuario.avatar_url,
        is_active: usuario.is_active,
        created_at: usuario.created_at,
        updated_at: usuario.updated_at,
      },
    };
  }

  /**
   * Logout - revocar refresh token
   */
  async logout(userId: number, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

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

    // Validar que los secrets existen antes de firmar
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new Error(
        'JWT secrets no configurados. Verifique JWT_ACCESS_SECRET y JWT_REFRESH_SECRET.',
      );
    }

    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(accessPayload, {
          secret: accessSecret,
          expiresIn: accessExpiresInSeconds,
        }),
        this.jwtService.signAsync(refreshPayload, {
          secret: refreshSecret,
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
    } catch (error) {
      // Agregar contexto al error para facilitar debugging
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error generando tokens JWT: ${errorMessage}`);
    }
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
    const tokenHash = this.hashToken(refreshToken);
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
  private hashToken(token: string): string {
    // Usamos SHA256 para hash rápido (no bcrypt porque no necesitamos comparar)
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
