import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock de bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsuariosService', () => {
  let service: UsuariosService;
  let prismaService: jest.Mocked<PrismaService>;

  // Mock del usuario de base de datos (con BigInt)
  const mockDbUser = {
    id: BigInt(1),
    email: 'test@example.com',
    nombre: 'Test',
    apellido: 'User',
    rol: 'user',
    rol_id: BigInt(1),
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    password_hash: 'hashed_password',
    google_id: null,
    provider: 'local',
    avatar_url: null,
  };

  // Usuario sanitizado esperado (con Number)
  const expectedSanitizedUser = {
    id: 1,
    email: 'test@example.com',
    nombre: 'Test',
    apellido: 'User',
    rol: 'user',
    is_active: true,
    created_at: mockDbUser.created_at,
    updated_at: mockDbUser.updated_at,
    deleted_at: null,
    provider: 'local',
    avatar_url: null,
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    mockBcrypt.hash.mockResolvedValue('hashed_password' as never);
    mockBcrypt.compare.mockResolvedValue(true as never);

    const mockPrisma = {
      usuarios: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      roles: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('12') },
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =============================================
  // Tests para create()
  // =============================================
  describe('create', () => {
    const createDto = {
      email: 'new@example.com',
      password: 'password123',
      nombre: 'New',
      apellido: 'User',
      rol: 'user',
    };

    it('should create a new user successfully', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.usuarios, 'create').mockResolvedValue({
        ...mockDbUser,
        email: createDto.email,
        nombre: createDto.nombre,
        apellido: createDto.apellido,
      });

      const result = await service.create(createDto);

      expect(prismaService.usuarios.findUnique).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
      expect(prismaService.usuarios.create).toHaveBeenCalled();
      expect(result.email).toBe(createDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      jest
        .spyOn(prismaService.usuarios, 'findUnique')
        .mockResolvedValue(mockDbUser);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prismaService.usuarios.create).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // Tests para findByEmail()
  // =============================================
  describe('findByEmail', () => {
    it('should return user if found', async () => {
      jest
        .spyOn(prismaService.usuarios, 'findUnique')
        .mockResolvedValue(mockDbUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockDbUser);
      expect(prismaService.usuarios.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com', is_active: true },
      });
    });

    it('should return null if user not found', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  // =============================================
  // Tests para findByGoogleId()
  // =============================================
  describe('findByGoogleId', () => {
    it('should return sanitized user if found', async () => {
      const googleUser = { ...mockDbUser, google_id: 'google123' };
      jest
        .spyOn(prismaService.usuarios, 'findUnique')
        .mockResolvedValue(googleUser);

      const result = await service.findByGoogleId('google123');

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);

      const result = await service.findByGoogleId('nonexistent');

      expect(result).toBeNull();
    });
  });

  // =============================================
  // Tests para createFromGoogle()
  // =============================================
  describe('createFromGoogle', () => {
    const googlePayload = {
      sub: 'google123',
      email: 'google@example.com',
      name: 'Google User',
      given_name: 'Google',
      family_name: 'User',
      picture: 'https://example.com/avatar.jpg',
    };

    it('should create user from Google payload', async () => {
      const createdUser = {
        ...mockDbUser,
        email: googlePayload.email,
        google_id: googlePayload.sub,
        nombre: googlePayload.given_name,
        apellido: googlePayload.family_name,
        avatar_url: googlePayload.picture,
        provider: 'google',
        password_hash: null,
      };
      jest
        .spyOn(prismaService.usuarios, 'create')
        .mockResolvedValue(createdUser);

      const result = await service.createFromGoogle(googlePayload);

      expect(prismaService.usuarios.create).toHaveBeenCalledWith({
        data: {
          email: googlePayload.email,
          google_id: googlePayload.sub,
          nombre: googlePayload.given_name,
          apellido: googlePayload.family_name,
          avatar_url: googlePayload.picture,
          provider: 'google',
          password_hash: null,
        },
      });
      expect(result.email).toBe(googlePayload.email);
    });
  });

  // =============================================
  // Tests para findById()
  // =============================================
  describe('findById', () => {
    it('should return sanitized user if found', async () => {
      jest
        .spyOn(prismaService.usuarios, 'findUnique')
        .mockResolvedValue(mockDbUser);

      const result = await service.findById(1);

      expect(result).toEqual(expectedSanitizedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  // =============================================
  // Tests para findAll()
  // =============================================
  describe('findAll', () => {
    it('should return all active users by default', async () => {
      jest
        .spyOn(prismaService.usuarios, 'findMany')
        .mockResolvedValue([mockDbUser]);

      const result = await service.findAll();

      expect(prismaService.usuarios.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
        include: { rol_ref: true },
      });
      expect(result).toHaveLength(1);
    });

    it('should include inactive users when specified', async () => {
      jest
        .spyOn(prismaService.usuarios, 'findMany')
        .mockResolvedValue([mockDbUser]);

      await service.findAll(true);

      expect(prismaService.usuarios.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { created_at: 'desc' },
        include: { rol_ref: true },
      });
    });
  });

  // =============================================
  // Tests para update()
  // =============================================
  describe('update', () => {
    const updateDto = {
      nombre: 'Updated',
      apellido: 'Name',
    };

    it('should update user successfully', async () => {
      jest
        .spyOn(prismaService.usuarios, 'findUnique')
        .mockResolvedValue(mockDbUser);
      jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({
        ...mockDbUser,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result.nombre).toBe('Updated');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new email already exists', async () => {
      jest
        .spyOn(prismaService.usuarios, 'findUnique')
        .mockResolvedValue(mockDbUser);
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        ...mockDbUser,
        id: BigInt(2),
      });

      await expect(
        service.update(1, { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =============================================
  // Tests para remove()
  // =============================================
  describe('remove', () => {
    it('should soft delete user', async () => {
      jest
        .spyOn(prismaService.usuarios, 'findUnique')
        .mockResolvedValue(mockDbUser);
      jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({
        ...mockDbUser,
        is_active: false,
        deleted_at: new Date(),
      });

      const result = await service.remove(1, 'admin');

      expect(prismaService.usuarios.update).toHaveBeenCalled();
      expect(result.is_active).toBe(false);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // =============================================
  // Tests para validatePassword()
  // =============================================
  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validatePassword('password', 'hash');

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password', 'hash');
    });

    it('should return false for invalid password', async () => {
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validatePassword('wrong', 'hash');

      expect(result).toBe(false);
    });
  });

  // =============================================
  // Tests para findAllRoles()
  // =============================================
  describe('findAllRoles', () => {
    it('should return all active roles', async () => {
      const mockRoles = [
        { id: BigInt(1), nombre: 'user', nivel: 1, is_active: true },
        { id: BigInt(2), nombre: 'admin', nivel: 10, is_active: true },
      ];
      jest.spyOn(prismaService.roles, 'findMany').mockResolvedValue(mockRoles);

      const result = await service.findAllRoles();

      expect(prismaService.roles.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { nivel: 'asc' },
      });
      expect(result).toEqual(mockRoles);
    });
  });
});
