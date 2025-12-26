/**
 * Test Utilities para E2E
 * ========================
 *
 * Este módulo proporciona utilidades comunes para tests E2E:
 * - Crear aplicación de test con configuración completa
 * - Helpers para autenticación (login, registro)
 * - Limpieza de datos entre tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Mock del ThrottlerGuard que siempre permite las requests
 */
class MockThrottlerGuard {
  canActivate() {
    return true;
  }
}

/**
 * Crea una aplicación NestJS configurada para E2E tests
 *
 * Incluye:
 * - ValidationPipe con las mismas opciones que producción
 * - Cookie parser para manejar tokens en cookies
 * - Prefijo de API igual a producción
 * - Rate limiting deshabilitado para tests
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    // Deshabilitar rate limiting para tests
    .overrideGuard(ThrottlerGuard)
    .useClass(MockThrottlerGuard)
    .compile();

  const app = moduleFixture.createNestApplication();

  // Configurar igual que main.ts
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  await app.init();
  return app;
}

/**
 * Interface para credenciales de usuario de test
 */
export interface TestUser {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

/**
 * Interface para tokens de autenticación
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  cookies: string[];
}

/**
 * Registra un usuario de prueba y retorna los tokens
 */
export async function registerTestUser(
  app: INestApplication,
  user: TestUser,
): Promise<AuthTokens> {
  const response = await request(app.getHttpServer() as Server)
    .post('/api/auth/register')
    .send(user)
    .expect(201);

  const cookies = (response.headers['set-cookie'] as unknown as string[]) || [];

  return {
    accessToken: extractCookieValue(cookies, 'accessToken'),
    refreshToken: extractCookieValue(cookies, 'refreshToken'),
    cookies,
  };
}

/**
 * Inicia sesión con un usuario existente
 */
export async function loginTestUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<AuthTokens> {
  const response = await request(app.getHttpServer() as Server)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const cookies = (response.headers['set-cookie'] as unknown as string[]) || [];

  return {
    accessToken: extractCookieValue(cookies, 'accessToken'),
    refreshToken: extractCookieValue(cookies, 'refreshToken'),
    cookies,
  };
}

/**
 * Extrae el valor de una cookie específica
 */
export function extractCookieValue(
  cookies: string[] | undefined,
  cookieName: string,
): string {
  if (!cookies) return '';

  const cookie = cookies.find((c) => c.startsWith(`${cookieName}=`));
  if (!cookie) return '';

  const match = cookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : '';
}

/**
 * Genera un email único para evitar conflictos entre tests
 */
export function generateUniqueEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@test.com`;
}

/**
 * Limpia datos de prueba de la base de datos
 *
 * IMPORTANTE: Solo usar en BD de test, nunca en producción
 * El orden de eliminación respeta foreign keys
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  // Orden de eliminación para respetar foreign keys
  // Usamos los nombres de modelos como están en PrismaService
  await prisma.reservas.deleteMany();
  await prisma.producto_variantes.deleteMany();
  await prisma.productos.deleteMany();
  await prisma.colores.deleteMany();
  await prisma.talles.deleteMany();
  await prisma.refresh_tokens.deleteMany();
  await prisma.usuarios.deleteMany();
}

/**
 * Crea un usuario de test por defecto
 */
export function createDefaultTestUser(): TestUser {
  return {
    email: generateUniqueEmail(),
    password: 'TestPassword123!',
    nombre: 'Test',
    apellido: 'User',
  };
}
