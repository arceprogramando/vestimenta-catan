import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto';

// Tipo para usuario sanitizado (sin datos sensibles)
export interface SanitizedUser {
  id: number;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  provider?: string;
  avatar_url?: string | null;
}

@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Crear un nuevo usuario
   */
  async create(createUsuarioDto: CreateUsuarioDto) {
    const { password, ...userData } = createUsuarioDto;

    // Verificar si el email ya existe
    const existingUser = await this.prisma.usuarios.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de la contraseña
    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const usuario = await this.prisma.usuarios.create({
      data: {
        ...userData,
        password_hash: passwordHash,
      },
    });

    return this.sanitizeUser(usuario);
  }

  /**
   * Buscar usuario por email (incluye password_hash para validación)
   */
  async findByEmail(email: string) {
    return this.prisma.usuarios.findUnique({
      where: { email, is_active: true },
    });
  }

  /**
   * Buscar usuario por Google ID
   */
  async findByGoogleId(googleId: string): Promise<SanitizedUser | null> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { google_id: googleId, is_active: true },
    });

    if (!usuario) return null;
    return this.sanitizeUser(usuario);
  }

  /**
   * Crear usuario desde Google OAuth
   */
  async createFromGoogle(googlePayload: {
    sub: string;
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  }): Promise<SanitizedUser> {
    const usuario = await this.prisma.usuarios.create({
      data: {
        email: googlePayload.email,
        google_id: googlePayload.sub,
        nombre: googlePayload.given_name || googlePayload.name || null,
        apellido: googlePayload.family_name || null,
        avatar_url: googlePayload.picture || null,
        provider: 'google',
        password_hash: null, // Sin password para usuarios de Google
      },
    });

    return this.sanitizeUser(usuario);
  }

  /**
   * Vincular cuenta de Google a usuario existente
   */
  async linkGoogleAccount(
    userId: number,
    googlePayload: {
      sub: string;
      picture?: string;
    },
  ): Promise<SanitizedUser> {
    const usuario = await this.prisma.usuarios.update({
      where: { id: BigInt(userId) },
      data: {
        google_id: googlePayload.sub,
        avatar_url: googlePayload.picture || undefined,
        updated_at: new Date(),
      },
    });

    return this.sanitizeUser(usuario);
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: number) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: BigInt(id), is_active: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.sanitizeUser(usuario);
  }

  /**
   * Obtener todos los usuarios (solo admin)
   */
  async findAll(includeInactive = false) {
    const usuarios = await this.prisma.usuarios.findMany({
      where: includeInactive ? {} : { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    return usuarios.map((u) => this.sanitizeUser(u));
  }

  /**
   * Actualizar usuario
   */
  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const { password, ...userData } = updateUsuarioDto;

    // Verificar que el usuario existe
    await this.findById(id);

    // Si se actualiza el email, verificar que no exista
    if (userData.email) {
      const existingUser = await this.prisma.usuarios.findFirst({
        where: {
          email: userData.email,
          NOT: { id: BigInt(id) },
        },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Preparar datos para actualizar
    const updateData: Record<string, unknown> = { ...userData };

    // Si hay nueva contraseña, hacer hash
    if (password) {
      const saltRounds = parseInt(
        this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'),
        10,
      );
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    const usuario = await this.prisma.usuarios.update({
      where: { id: BigInt(id) },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    return this.sanitizeUser(usuario);
  }

  /**
   * Soft delete de usuario
   */
  async remove(id: number, deletedBy?: string) {
    await this.findById(id);

    const usuario = await this.prisma.usuarios.update({
      where: { id: BigInt(id) },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_by: deletedBy || 'system',
        delete_reason: 'Usuario eliminado',
      },
    });

    return this.sanitizeUser(usuario);
  }

  /**
   * Validar contraseña
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Remover datos sensibles del usuario
   */
  private sanitizeUser(usuario: {
    id: bigint;
    email: string;
    nombre: string | null;
    apellido: string | null;
    rol: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    password_hash?: string | null;
    google_id?: string | null;
    provider?: string;
    avatar_url?: string | null;
  }): SanitizedUser {
    const { password_hash, google_id, ...rest } = usuario;
    return {
      ...rest,
      id: Number(rest.id),
    };
  }
}
