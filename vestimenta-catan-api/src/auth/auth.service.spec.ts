/**
 * ============================================
 * AUTH SERVICE - UNIT TESTS
 * ============================================
 *
 * Este archivo contiene tests unitarios para AuthService.
 *
 * CONCEPTOS CLAVE:
 * - Mocks: Simulamos las dependencias (Prisma, JWT, etc.)
 * - Spies: Espiamos llamadas a funciones
 * - AAA Pattern: Arrange, Act, Assert
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PrismaService } from '../prisma/prisma.service';

// ============================================
// MOCKS - Simulamos las dependencias
// ============================================

/**
 * Mock de usuario para tests
 * Simula lo que devolvería la base de datos
 */
const mockUser = {
  id: BigInt(1),
  email: 'test@example.com',
  nombre: 'Test',
  apellido: 'User',
  password_hash: '$2b$12$hashedpassword', // Simula hash de bcrypt
  rol: 'user',
  rol_id: BigInt(2),
  provider: 'local',
  avatar_url: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * Mock del UsuariosService
 * Cada método es una función jest.fn() que podemos configurar
 */
const mockUsuariosService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  validatePassword: jest.fn(),
  findByGoogleId: jest.fn(),
};

/**
 * Mock del JwtService
 * signAsync simula la generación de tokens
 */
const mockJwtService = {
  signAsync: jest.fn(),
};

/**
 * Mock del ConfigService
 * get() devuelve valores de configuración simulados
 */
const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: string) => {
    const config: Record<string, string> = {
      JWT_ACCESS_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
    };
    return config[key] || defaultValue;
  }),
};

/**
 * Mock del PrismaService
 * Simula operaciones de base de datos
 */
const mockPrismaService = {
  refresh_tokens: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

// ============================================
// TEST SUITE
// ============================================

describe('AuthService', () => {
  let service: AuthService;

  /**
   * beforeEach: Se ejecuta ANTES de cada test
   *
   * Aquí creamos un módulo de testing con todos los mocks.
   * Es como crear un "mini NestJS" solo para tests.
   */
  beforeEach(async () => {
    // Limpiar todos los mocks antes de cada test
    // Esto evita que datos de tests anteriores afecten
    jest.clearAllMocks();

    // Crear módulo de testing
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // Inyectamos mocks en lugar de servicios reales
        {
          provide: UsuariosService,
          useValue: mockUsuariosService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    // Obtener instancia del servicio
    service = module.get<AuthService>(AuthService);
  });

  // ==========================================
  // TEST: El servicio existe
  // ==========================================
  it('should be defined', () => {
    /**
     * Test básico: verifica que el servicio se creó correctamente.
     * Si falla, hay un problema con la configuración del módulo.
     */
    expect(service).toBeDefined();
  });

  // ==========================================
  // TESTS: register()
  // ==========================================
  describe('register', () => {
    const registerDto = {
      email: 'nuevo@example.com',
      password: 'Password123!',
      nombre: 'Nuevo',
      apellido: 'Usuario',
    };

    it('should register a new user successfully', async () => {
      /**
       * CASO: Registro exitoso de usuario nuevo
       *
       * ARRANGE: Configuramos los mocks para simular:
       * 1. El email NO existe (findByEmail devuelve null)
       * 2. El usuario se crea exitosamente
       * 3. Los tokens se generan correctamente
       */

      // Simular que el email no existe
      mockUsuariosService.findByEmail.mockResolvedValue(null);

      // Simular creación de usuario exitosa
      const createdUser = {
        id: 2,
        email: registerDto.email,
        nombre: registerDto.nombre,
        apellido: registerDto.apellido,
        rol: 'user',
      };
      mockUsuariosService.create.mockResolvedValue(createdUser);

      // Simular generación de tokens
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock-access-token') // Primera llamada: access token
        .mockResolvedValueOnce('mock-refresh-token'); // Segunda llamada: refresh token

      // Simular guardado de refresh token
      mockPrismaService.refresh_tokens.create.mockResolvedValue({});

      /**
       * ACT: Ejecutamos el método que queremos probar
       */
      const result = await service.register(registerDto);

      /**
       * ASSERT: Verificamos los resultados
       */
      // Verificar que se buscó el email
      expect(mockUsuariosService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );

      // Verificar que se creó el usuario con rol 'user'
      expect(mockUsuariosService.create).toHaveBeenCalledWith({
        ...registerDto,
        rol: 'user',
      });

      // Verificar estructura del resultado
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      /**
       * CASO: Intento de registro con email duplicado
       *
       * ARRANGE: El email YA existe en la base de datos
       */
      mockUsuariosService.findByEmail.mockResolvedValue(mockUser);

      /**
       * ACT & ASSERT: Esperamos que lance ConflictException
       *
       * expect().rejects es para funciones async que lanzan errores
       */
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );

      // Verificar que NO se intentó crear usuario
      expect(mockUsuariosService.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // TESTS: login()
  // ==========================================
  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login successfully with valid credentials', async () => {
      /**
       * CASO: Login exitoso
       */

      // ARRANGE
      mockUsuariosService.findByEmail.mockResolvedValue(mockUser);
      mockUsuariosService.validatePassword.mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock-access-token')
        .mockResolvedValueOnce('mock-refresh-token');
      mockPrismaService.refresh_tokens.create.mockResolvedValue({});

      // ACT
      const result = await service.login(loginDto);

      // ASSERT
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      /**
       * CASO: Usuario no existe
       */
      mockUsuariosService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      /**
       * CASO: Password incorrecto
       */
      mockUsuariosService.findByEmail.mockResolvedValue(mockUser);
      mockUsuariosService.validatePassword.mockResolvedValue(false); // Password inválido

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for Google-only accounts', async () => {
      /**
       * CASO: Cuenta creada con Google (sin password_hash)
       */
      const googleUser = { ...mockUser, password_hash: null };
      mockUsuariosService.findByEmail.mockResolvedValue(googleUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ==========================================
  // TESTS: logout()
  // ==========================================
  describe('logout', () => {
    it('should logout successfully', async () => {
      /**
       * CASO: Logout exitoso - revoca el refresh token
       */
      mockPrismaService.refresh_tokens.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.logout(1, 'some-refresh-token');

      expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
      expect(mockPrismaService.refresh_tokens.updateMany).toHaveBeenCalled();
    });
  });

  // ==========================================
  // TESTS: logoutAll()
  // ==========================================
  describe('logoutAll', () => {
    it('should revoke all refresh tokens for user', async () => {
      /**
       * CASO: Cerrar todas las sesiones
       */
      mockPrismaService.refresh_tokens.updateMany.mockResolvedValue({
        count: 3,
      });

      const result = await service.logoutAll(1);

      expect(result).toEqual({
        message: 'Todas las sesiones han sido cerradas',
      });
    });
  });

  // ==========================================
  // TESTS: cleanupExpiredTokens()
  // ==========================================
  describe('cleanupExpiredTokens', () => {
    it('should delete expired and revoked tokens', async () => {
      /**
       * CASO: Limpieza de tokens expirados
       */
      mockPrismaService.refresh_tokens.deleteMany.mockResolvedValue({
        count: 5,
      });

      const result = await service.cleanupExpiredTokens();

      expect(result).toEqual({ deleted: 5 });
    });
  });

  // ==========================================
  // TESTS: parseExpiresIn() - Método privado
  // ==========================================
  describe('parseExpiresIn (via generateTokens behavior)', () => {
    /**
     * Los métodos privados no se testean directamente.
     * Se testean indirectamente a través de métodos públicos.
     *
     * Pero podemos acceder a ellos con: (service as any).parseExpiresIn()
     */

    it('should parse "15m" as 900 seconds', () => {
      // Acceder a método privado (no recomendado pero útil para tests)
      const result = (service as unknown as { parseExpiresIn: (s: string) => number }).parseExpiresIn('15m');
      expect(result).toBe(900); // 15 * 60
    });

    it('should parse "7d" as 604800 seconds', () => {
      const result = (service as unknown as { parseExpiresIn: (s: string) => number }).parseExpiresIn('7d');
      expect(result).toBe(604800); // 7 * 24 * 60 * 60
    });

    it('should parse "1h" as 3600 seconds', () => {
      const result = (service as unknown as { parseExpiresIn: (s: string) => number }).parseExpiresIn('1h');
      expect(result).toBe(3600); // 1 * 60 * 60
    });

    it('should return 900 for invalid format', () => {
      const result = (service as unknown as { parseExpiresIn: (s: string) => number }).parseExpiresIn('invalid');
      expect(result).toBe(900); // Default
    });
  });
});
