/**
 * Auth E2E Tests
 * ===============
 *
 * Tests End-to-End para el módulo de autenticación.
 * Cada suite crea su propia instancia de la app para evitar
 * problemas de rate limiting entre tests.
 */

import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestApp,
  createDefaultTestUser,
  cleanDatabase,
  extractCookieValue,
  TestUser,
} from './helpers/test-utils';

interface AuthResponse {
  user: { email: string; nombre: string };
  expiresIn: number;
  tokenType: string;
}

interface ErrorResponse {
  message: string;
}

describe('Auth (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  // =============================================
  // REGISTRO DE USUARIOS
  // =============================================
  describe('POST /api/auth/register', () => {
    let testUser: TestUser;

    beforeEach(async () => {
      await cleanDatabase(prisma);
      testUser = createDefaultTestUser();
    });

    it('debería registrar un nuevo usuario exitosamente', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Verificar respuesta
      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe(testUser.email);
      expect(body.user.nombre).toBe(testUser.nombre);
      expect(body.expiresIn).toBeDefined();
      expect(body.tokenType).toBe('Bearer');

      // Verificar que NO devuelve tokens en el body (seguridad)
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');

      // Verificar cookies httpOnly
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('accessToken'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });

    it('debería rechazar registro con email duplicado', async () => {
      // Primero registrar
      await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Crear nuevo usuario con mismo email
      const duplicateUser = { ...testUser };

      // Intentar registrar de nuevo con el mismo email
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(409);

      expect((response.body as ErrorResponse).message).toContain(
        'email ya está registrado',
      );
    });
  });

  // =============================================
  // LOGIN
  // =============================================
  describe('POST /api/auth/login', () => {
    let testUser: TestUser;

    beforeAll(async () => {
      await cleanDatabase(prisma);
      testUser = createDefaultTestUser();
      // Registrar usuario una vez para todos los tests de login
      await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('debería hacer login exitosamente con credenciales válidas', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe(testUser.email);

      // Verificar cookies
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
    });

    it('debería rechazar login con password incorrecta', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect((response.body as ErrorResponse).message).toContain(
        'Credenciales',
      );
    });

    it('debería rechazar login con email inexistente', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: testUser.password,
        })
        .expect(401);
    });
  });

  // =============================================
  // USUARIO ACTUAL (/me)
  // =============================================
  describe('GET /api/auth/me', () => {
    it('debería rechazar acceso sin autenticación', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/auth/me')
        .expect(401);
    });

    it('debería rechazar acceso con token inválido', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/auth/me')
        .set('Cookie', 'accessToken=token-invalido-123')
        .expect(401);
    });

    it('debería retornar datos del usuario autenticado', async () => {
      await cleanDatabase(prisma);
      const testUser = createDefaultTestUser();

      // Registrar y obtener cookies
      const registerResponse = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const cookies = registerResponse.headers[
        'set-cookie'
      ] as unknown as string[];
      const accessToken = extractCookieValue(cookies, 'accessToken');

      // Usar el token para acceder a /me
      const response = await request(app.getHttpServer() as Server)
        .get('/api/auth/me')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', testUser.email);
    });
  });

  // =============================================
  // REFRESH TOKEN
  // =============================================
  describe('POST /api/auth/refresh', () => {
    it('debería rechazar refresh con token inválido', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=token-invalido')
        .expect(401);
    });

    it('debería renovar tokens con refresh token válido', async () => {
      await cleanDatabase(prisma);
      const testUser = createDefaultTestUser();

      // Registrar y obtener cookies
      const registerResponse = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const cookies = registerResponse.headers[
        'set-cookie'
      ] as unknown as string[];
      const refreshToken = extractCookieValue(cookies, 'refreshToken');

      // Usar refresh token
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      // Debe retornar nuevos tokens
      const newCookies = response.headers['set-cookie'] as unknown as string[];
      expect(newCookies).toBeDefined();
    });
  });

  // =============================================
  // LOGOUT
  // =============================================
  describe('POST /api/auth/logout', () => {
    it('debería rechazar logout sin autenticación', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/auth/logout')
        .expect(401);
    });

    it('debería cerrar sesión exitosamente', async () => {
      await cleanDatabase(prisma);
      const testUser = createDefaultTestUser();

      // Registrar y obtener cookies
      const registerResponse = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const cookies = registerResponse.headers[
        'set-cookie'
      ] as unknown as string[];
      const accessToken = extractCookieValue(cookies, 'accessToken');
      const refreshToken = extractCookieValue(cookies, 'refreshToken');

      // Logout
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/logout')
        .set('Cookie', [
          `accessToken=${accessToken}`,
          `refreshToken=${refreshToken}`,
        ])
        .expect(200);

      expect((response.body as ErrorResponse).message).toContain('cerrada');
    });
  });

  // =============================================
  // LOGOUT ALL
  // =============================================
  describe('POST /api/auth/logout-all', () => {
    it('debería cerrar todas las sesiones', async () => {
      await cleanDatabase(prisma);
      const testUser = createDefaultTestUser();

      // Registrar
      const registerResponse = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const cookies = registerResponse.headers[
        'set-cookie'
      ] as unknown as string[];
      const accessToken = extractCookieValue(cookies, 'accessToken');

      // Logout all
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/logout-all')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect((response.body as ErrorResponse).message).toContain(
        'Todas las sesiones',
      );
    });
  });
});
