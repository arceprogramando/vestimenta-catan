/**
 * Productos E2E Tests
 * ====================
 *
 * Tests End-to-End para el módulo de productos.
 * Incluye CRUD completo y validaciones.
 */

import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { genero } from '@prisma/client';
import {
  createTestApp,
  createDefaultTestUser,
  registerTestUser,
  cleanDatabase,
  AuthTokens,
} from './helpers/test-utils';

interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  genero: string;
  thumbnail?: string;
  precio?: number;
  is_active: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface ErrorResponse {
  message: string;
  statusCode: number;
}

describe('Productos (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authTokens: AuthTokens;
  let adminCredentials: { email: string; password: string };

  const testProducto = {
    nombre: 'Campera térmica',
    descripcion: 'Campera de invierno impermeable',
    genero: 'mujer' as genero,
    precio: 25000,
  };

  // Helper para refrescar token
  async function refreshAdminToken() {
    const loginResponse = await request(app.getHttpServer() as Server)
      .post('/api/auth/login')
      .send(adminCredentials)
      .expect(200);
    const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
    const newToken = extractCookieValue(cookies, 'accessToken');
    if (newToken) {
      authTokens.accessToken = newToken;
    }
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get<PrismaService>(PrismaService);

    // Limpiar y crear usuario admin para autenticación
    await cleanDatabase(prisma);
    const testUser = createDefaultTestUser();
    adminCredentials = { email: testUser.email, password: testUser.password };
    authTokens = await registerTestUser(app, testUser);

    // Hacer al usuario admin para tener permisos completos
    await prisma.usuarios.updateMany({
      where: { email: testUser.email },
      data: { rol: 'admin' },
    });

    // Re-login para obtener tokens con rol actualizado
    await refreshAdminToken();
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  beforeEach(async () => {
    // Limpiar productos antes de cada test
    await prisma.producto_variantes.deleteMany();
    await prisma.productos.deleteMany();
  });

  // =============================================
  // CREAR PRODUCTO
  // =============================================
  describe('POST /api/productos', () => {
    it('debería crear un producto exitosamente', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send(testProducto)
        .expect(201);

      const body = response.body as Producto;
      expect(body.nombre).toBe(testProducto.nombre);
      expect(body.descripcion).toBe(testProducto.descripcion);
      expect(body.genero).toBe(testProducto.genero);
      expect(body.is_active).toBe(true);
      expect(body.id).toBeDefined();
    });

    it('debería rechazar producto sin nombre', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send({ genero: 'mujer' })
        .expect(400);

      expect((response.body as ErrorResponse).message).toBeDefined();
    });

    it('debería rechazar producto con género inválido', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send({ nombre: 'Test', genero: 'invalido' })
        .expect(400);

      expect((response.body as ErrorResponse).message).toBeDefined();
    });

    it('debería rechazar producto sin autenticación', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/productos')
        .send(testProducto)
        .expect(401);
    });

    it('debería crear producto con todos los campos opcionales', async () => {
      const productoCompleto = {
        ...testProducto,
        thumbnail: 'https://example.com/image.jpg',
        precio: 15000.5,
      };

      const response = await request(app.getHttpServer() as Server)
        .post('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send(productoCompleto)
        .expect(201);

      const body = response.body as Producto;
      expect(body.thumbnail).toBe(productoCompleto.thumbnail);
      expect(Number(body.precio)).toBeCloseTo(productoCompleto.precio, 2);
    });
  });

  // =============================================
  // LISTAR PRODUCTOS
  // =============================================
  describe('GET /api/productos', () => {
    beforeAll(async () => {
      await refreshAdminToken();
    });

    beforeEach(async () => {
      // Crear algunos productos de prueba
      await prisma.productos.createMany({
        data: [
          { nombre: 'Producto 1', genero: 'mujer' },
          { nombre: 'Producto 2', genero: 'hombre' },
          { nombre: 'Producto 3', genero: 'ninios' },
        ],
      });
    });

    it('debería listar todos los productos activos', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .expect(200);

      const body = response.body as PaginatedResponse<Producto>;
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(3);
      expect(body.meta).toBeDefined();
      expect(body.meta.total).toBe(3);
    });

    it('debería excluir productos inactivos (soft deleted)', async () => {
      // Soft delete uno
      await prisma.productos.updateMany({
        where: { nombre: 'Producto 1' },
        data: { is_active: false, deleted_at: new Date() },
      });

      const response = await request(app.getHttpServer() as Server)
        .get('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .expect(200);

      const body = response.body as PaginatedResponse<Producto>;
      expect(body.data.length).toBe(2);
      expect(body.meta.total).toBe(2);
    });
  });

  // =============================================
  // OBTENER PRODUCTO POR ID
  // =============================================
  describe('GET /api/productos/:id', () => {
    let productoId: string;

    beforeAll(async () => {
      await refreshAdminToken();
    });

    beforeEach(async () => {
      const producto = await prisma.productos.create({
        data: testProducto,
      });
      productoId = producto.id.toString();
    });

    it('debería obtener un producto por ID', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/productos/${productoId}`)
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .expect(200);

      const body = response.body as Producto;
      expect(body.nombre).toBe(testProducto.nombre);
    });

    it('debería retornar 404 para producto inexistente', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/productos/999999')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .expect(404);
    });

    it('debería retornar 404 para producto eliminado (soft delete)', async () => {
      await prisma.productos.update({
        where: { id: parseInt(productoId) },
        data: { is_active: false, deleted_at: new Date() },
      });

      await request(app.getHttpServer() as Server)
        .get(`/api/productos/${productoId}`)
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .expect(404);
    });
  });

  // =============================================
  // ACTUALIZAR PRODUCTO
  // =============================================
  describe('PATCH /api/productos/:id', () => {
    let productoId: string;

    beforeAll(async () => {
      await refreshAdminToken();
    });

    beforeEach(async () => {
      const producto = await prisma.productos.create({
        data: testProducto,
      });
      productoId = producto.id.toString();
    });

    it('debería actualizar un producto', async () => {
      const update = { nombre: 'Nombre actualizado', precio: 30000 };

      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/productos/${productoId}`)
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send(update)
        .expect(200);

      const body = response.body as Producto;
      expect(body.nombre).toBe(update.nombre);
      expect(Number(body.precio)).toBe(update.precio);
    });

    it('debería actualizar parcialmente (solo algunos campos)', async () => {
      const update = { descripcion: 'Nueva descripción' };

      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/productos/${productoId}`)
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send(update)
        .expect(200);

      const body = response.body as Producto;
      expect(body.descripcion).toBe(update.descripcion);
      expect(body.nombre).toBe(testProducto.nombre); // No cambió
    });

    it('debería retornar 404 para producto inexistente', async () => {
      await request(app.getHttpServer() as Server)
        .patch('/api/productos/999999')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send({ nombre: 'Test' })
        .expect(404);
    });

    it('debería rechazar actualización sin autenticación', async () => {
      await request(app.getHttpServer() as Server)
        .patch(`/api/productos/${productoId}`)
        .send({ nombre: 'Test' })
        .expect(401);
    });
  });

  // =============================================
  // ELIMINAR PRODUCTO (SOFT DELETE)
  // =============================================
  describe('DELETE /api/productos/:id', () => {
    let productoId: string;

    beforeAll(async () => {
      await refreshAdminToken();
    });

    beforeEach(async () => {
      const producto = await prisma.productos.create({
        data: testProducto,
      });
      productoId = producto.id.toString();
    });

    it('debería eliminar un producto (soft delete)', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/productos/${productoId}`)
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .expect(200);

      // Verificar que está soft deleted
      const producto = await prisma.productos.findUnique({
        where: { id: parseInt(productoId) },
      });
      expect(producto?.is_active).toBe(false);
      expect(producto?.deleted_at).not.toBeNull();
    });

    it('debería retornar 404 para producto inexistente', async () => {
      await request(app.getHttpServer() as Server)
        .delete('/api/productos/999999')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .expect(404);
    });

    it('debería rechazar eliminación sin autenticación', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/productos/${productoId}`)
        .expect(401);
    });
  });

  // =============================================
  // VALIDACIONES
  // =============================================
  describe('Validaciones', () => {
    beforeEach(async () => {
      // Refrescar token antes de cada test de validación
      await refreshAdminToken();
    });

    it('debería rechazar nombre muy largo (>255 caracteres)', async () => {
      const nombreLargo = 'a'.repeat(256);

      await request(app.getHttpServer() as Server)
        .post('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send({ nombre: nombreLargo, genero: 'mujer' })
        .expect(400);
    });

    it('debería rechazar descripción muy larga (>500 caracteres)', async () => {
      const descripcionLarga = 'a'.repeat(501);

      await request(app.getHttpServer() as Server)
        .post('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send({
          nombre: 'Test',
          genero: 'mujer',
          descripcion: descripcionLarga,
        })
        .expect(400);
    });

    it('debería rechazar precio negativo', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send({ nombre: 'Test', genero: 'mujer', precio: -100 })
        .expect(400);
    });

    it('debería aceptar thumbnail como string (no requiere ser URL)', async () => {
      // El thumbnail actualmente solo valida que sea string, no URL
      const response = await request(app.getHttpServer() as Server)
        .post('/api/productos')
        .set('Cookie', `accessToken=${authTokens.accessToken}`)
        .send({
          nombre: 'Test Thumbnail',
          genero: 'mujer',
          thumbnail: 'imagen.jpg',
        })
        .expect(201);

      const body = response.body as Producto;
      expect(body.thumbnail).toBe('imagen.jpg');
    });
  });
});

// Helper local para extraer cookies
function extractCookieValue(
  cookies: string[] | undefined,
  cookieName: string,
): string {
  if (!cookies) return '';
  const cookie = cookies.find((c) => c.startsWith(`${cookieName}=`));
  if (!cookie) return '';
  const match = cookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : '';
}
