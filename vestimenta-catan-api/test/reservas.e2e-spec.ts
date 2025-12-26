/**
 * Reservas E2E Tests
 * ==================
 *
 * Tests End-to-End para el módulo de reservas.
 * Incluye CRUD, validaciones, permisos y flujo de estados.
 */

import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestApp,
  registerTestUser,
  cleanDatabase,
  AuthTokens,
} from './helpers/test-utils';

interface Reserva {
  id: number;
  variante_id: number;
  usuario_id: number | null;
  cantidad: number;
  estado: string;
  fecha_reserva: string;
  notas: string | null;
  telefono_contacto: string | null;
  precio_unitario: number | null;
  precio_total: number | null;
  is_active: boolean;
  variante?: {
    id: number;
    producto?: {
      nombre: string;
    };
    talle?: {
      nombre: string;
    };
    color?: {
      nombre: string;
    };
  };
}

interface ErrorResponse {
  message: string;
  statusCode: number;
}

describe('Reservas (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminTokens: AuthTokens;
  let userTokens: AuthTokens;
  let testVarianteId: bigint;
  let testUserId: bigint;

  const adminUser = {
    email: 'admin-reservas@test.com',
    password: 'Admin123!',
    nombre: 'Admin',
    apellido: 'Reservas',
  };

  const normalUser = {
    email: 'user-reservas@test.com',
    password: 'User123!',
    nombre: 'User',
    apellido: 'Normal',
  };

  // Helpers para refrescar tokens
  async function refreshAdminToken() {
    const loginResponse = await request(app.getHttpServer() as Server)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(200);
    const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
    const newToken = extractCookieValue(cookies, 'accessToken');
    if (newToken) {
      adminTokens.accessToken = newToken;
    }
  }

  async function refreshUserToken() {
    const loginResponse = await request(app.getHttpServer() as Server)
      .post('/api/auth/login')
      .send({ email: normalUser.email, password: normalUser.password })
      .expect(200);
    const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
    const newToken = extractCookieValue(cookies, 'accessToken');
    if (newToken) {
      userTokens.accessToken = newToken;
    }
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get<PrismaService>(PrismaService);

    await cleanDatabase(prisma);

    // Crear usuario admin
    adminTokens = await registerTestUser(app, adminUser);
    await prisma.usuarios.updateMany({
      where: { email: adminUser.email },
      data: { rol: 'admin' },
    });

    // Re-login para obtener tokens con rol admin
    await refreshAdminToken();

    // Crear usuario normal
    userTokens = await registerTestUser(app, normalUser);
    const userRecord = await prisma.usuarios.findUnique({
      where: { email: normalUser.email },
    });
    testUserId = userRecord!.id;

    // Crear datos de prueba: producto, color, talle, variante
    const producto = await prisma.productos.create({
      data: {
        nombre: 'Campera Test',
        genero: 'mujer',
        precio: 15000,
      },
    });

    const color = await prisma.colores.create({
      data: { nombre: 'Rojo Test' },
    });

    const talle = await prisma.talles.create({
      data: { nombre: 'M', orden: 2 },
    });

    const variante = await prisma.producto_variantes.create({
      data: {
        producto_id: producto.id,
        color_id: color.id,
        talle_id: talle.id,
        cantidad: 10,
      },
    });

    testVarianteId = variante.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  beforeEach(async () => {
    // Limpiar reservas antes de cada test
    await prisma.reservas.deleteMany();
  });

  // =============================================
  // CREAR RESERVA
  // =============================================
  describe('POST /api/reservas', () => {
    beforeAll(async () => {
      await refreshAdminToken();
      await refreshUserToken();
    });

    it('debería crear una reserva exitosamente', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: Number(testVarianteId),
          cantidad: 2,
        })
        .expect(201);

      const body = response.body as Reserva;
      expect(body.variante_id).toBe(Number(testVarianteId));
      expect(body.cantidad).toBe(2);
      expect(body.estado).toBe('pendiente');
      expect(body.is_active).toBe(true);
      expect(body.id).toBeDefined();
    });

    it('debería calcular precio total automáticamente', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: Number(testVarianteId),
          cantidad: 3,
        })
        .expect(201);

      const body = response.body as Reserva;
      expect(body.precio_unitario).toBe(15000);
      expect(body.precio_total).toBe(45000); // 15000 * 3
    });

    it('debería crear reserva con notas y teléfono', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: Number(testVarianteId),
          cantidad: 1,
          notas: 'Entregar por la tarde',
          telefono_contacto: '+54 9 2972 123456',
        })
        .expect(201);

      const body = response.body as Reserva;
      expect(body.notas).toBe('Entregar por la tarde');
      expect(body.telefono_contacto).toBe('+54 9 2972 123456');
    });

    it('debería rechazar reserva sin variante_id', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({ cantidad: 2 })
        .expect(400);

      expect((response.body as ErrorResponse).message).toBeDefined();
    });

    it('debería rechazar reserva con cantidad 0', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: Number(testVarianteId),
          cantidad: 0,
        })
        .expect(400);

      expect((response.body as ErrorResponse).message).toBeDefined();
    });

    it('debería rechazar reserva con cantidad negativa', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: Number(testVarianteId),
          cantidad: -1,
        })
        .expect(400);
    });

    it('debería rechazar reserva con stock insuficiente', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: Number(testVarianteId),
          cantidad: 100, // Stock es 10
        })
        .expect(400);

      expect((response.body as ErrorResponse).message).toContain(
        'Stock insuficiente',
      );
    });

    it('debería rechazar reserva para variante inexistente', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: 999999,
          cantidad: 1,
        })
        .expect(404);
    });

    it('debería rechazar reserva sin autenticación', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .send({
          variante_id: Number(testVarianteId),
          cantidad: 1,
        })
        .expect(401);
    });
  });

  // =============================================
  // LISTAR RESERVAS (ADMIN)
  // =============================================
  describe('GET /api/reservas', () => {
    beforeAll(async () => {
      await refreshAdminToken();
      await refreshUserToken();
    });

    beforeEach(async () => {
      // Crear algunas reservas de prueba
      await prisma.reservas.createMany({
        data: [
          {
            variante_id: testVarianteId,
            usuario_id: testUserId,
            cantidad: 1,
            estado: 'pendiente',
          },
          {
            variante_id: testVarianteId,
            usuario_id: testUserId,
            cantidad: 2,
            estado: 'confirmado',
          },
        ],
      });
    });

    it('debería listar todas las reservas como admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/reservas')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(200);

      const body = response.body as Reserva[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(2);
    });

    it('debería rechazar listado para usuario normal (solo admin)', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .expect(403);
    });

    it('debería excluir reservas eliminadas por defecto', async () => {
      // Soft delete una reserva
      await prisma.reservas.updateMany({
        where: { cantidad: 1 },
        data: { is_active: false, deleted_at: new Date() },
      });

      const response = await request(app.getHttpServer() as Server)
        .get('/api/reservas')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(200);

      const body = response.body as Reserva[];
      expect(body.length).toBe(1);
    });

    it('debería incluir reservas eliminadas con query param', async () => {
      await prisma.reservas.updateMany({
        where: { cantidad: 1 },
        data: { is_active: false, deleted_at: new Date() },
      });

      const response = await request(app.getHttpServer() as Server)
        .get('/api/reservas?includeDeleted=true')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(200);

      const body = response.body as Reserva[];
      expect(body.length).toBe(2);
    });
  });

  // =============================================
  // MIS RESERVAS (USUARIO)
  // =============================================
  describe('GET /api/reservas/mis-reservas', () => {
    beforeAll(async () => {
      await refreshAdminToken();
      await refreshUserToken();
    });

    beforeEach(async () => {
      await prisma.reservas.create({
        data: {
          variante_id: testVarianteId,
          usuario_id: testUserId,
          cantidad: 2,
          estado: 'pendiente',
        },
      });
    });

    it('debería obtener reservas del usuario autenticado', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/reservas/mis-reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .expect(200);

      const body = response.body as Reserva[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
      expect(body[0].usuario_id).toBe(Number(testUserId));
    });

    it('debería retornar array vacío para usuario sin reservas', async () => {
      // Limpiar reservas
      await prisma.reservas.deleteMany();

      const response = await request(app.getHttpServer() as Server)
        .get('/api/reservas/mis-reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  // =============================================
  // OBTENER RESERVA POR ID
  // =============================================
  describe('GET /api/reservas/:id', () => {
    let reservaId: string;

    beforeAll(async () => {
      await refreshAdminToken();
      await refreshUserToken();
    });

    beforeEach(async () => {
      const reserva = await prisma.reservas.create({
        data: {
          variante_id: testVarianteId,
          usuario_id: testUserId,
          cantidad: 1,
          estado: 'pendiente',
        },
      });
      reservaId = reserva.id.toString();
    });

    it('debería obtener una reserva por ID (dueño)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/reservas/${reservaId}`)
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .expect(200);

      const body = response.body as Reserva;
      expect(body.id).toBe(Number(reservaId));
    });

    it('debería obtener cualquier reserva como admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/reservas/${reservaId}`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(200);

      expect((response.body as Reserva).id).toBe(Number(reservaId));
    });

    it('debería retornar 404 para reserva inexistente', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/reservas/999999')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(404);
    });

    it('debería retornar 404 para reserva eliminada (soft delete)', async () => {
      await prisma.reservas.update({
        where: { id: BigInt(reservaId) },
        data: { is_active: false, deleted_at: new Date() },
      });

      await request(app.getHttpServer() as Server)
        .get(`/api/reservas/${reservaId}`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(404);
    });
  });

  // =============================================
  // ACTUALIZAR RESERVA (ADMIN)
  // =============================================
  describe('PATCH /api/reservas/:id', () => {
    let reservaId: string;

    beforeAll(async () => {
      await refreshAdminToken();
      await refreshUserToken();
    });

    beforeEach(async () => {
      const reserva = await prisma.reservas.create({
        data: {
          variante_id: testVarianteId,
          usuario_id: testUserId,
          cantidad: 1,
          estado: 'pendiente',
          precio_unitario: 15000,
          precio_total: 15000,
        },
      });
      reservaId = reserva.id.toString();
    });

    it('debería actualizar una reserva como admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/reservas/${reservaId}`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({ cantidad: 3, notas: 'Actualizado' })
        .expect(200);

      const body = response.body as Reserva;
      expect(body.cantidad).toBe(3);
      expect(body.notas).toBe('Actualizado');
      expect(body.precio_total).toBe(45000); // Recalculado
    });

    it('debería cambiar estado a confirmado', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/reservas/${reservaId}`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({ estado: 'confirmado' })
        .expect(200);

      const body = response.body as Reserva;
      expect(body.estado).toBe('confirmado');
    });

    it('debería cambiar estado a cancelado con motivo', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/reservas/${reservaId}`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({
          estado: 'cancelado',
          motivo_cancelacion: 'Cliente solicitó cancelar',
        })
        .expect(200);

      const body = response.body as Reserva;
      expect(body.estado).toBe('cancelado');
    });

    it('debería rechazar actualización para usuario normal', async () => {
      await request(app.getHttpServer() as Server)
        .patch(`/api/reservas/${reservaId}`)
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({ cantidad: 5 })
        .expect(403);
    });

    it('debería retornar 404 para reserva inexistente', async () => {
      await request(app.getHttpServer() as Server)
        .patch('/api/reservas/999999')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({ cantidad: 2 })
        .expect(404);
    });
  });

  // =============================================
  // ELIMINAR RESERVA (SOFT DELETE)
  // =============================================
  describe('DELETE /api/reservas/:id', () => {
    let reservaId: string;

    beforeAll(async () => {
      await refreshAdminToken();
      await refreshUserToken();
    });

    beforeEach(async () => {
      const reserva = await prisma.reservas.create({
        data: {
          variante_id: testVarianteId,
          usuario_id: testUserId,
          cantidad: 1,
          estado: 'pendiente',
        },
      });
      reservaId = reserva.id.toString();
    });

    it('debería eliminar una reserva (soft delete) como admin', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/reservas/${reservaId}`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .send({
          deleted_by: 'admin@test.com',
          delete_reason: 'Test de eliminación',
        })
        .expect(200);

      // Verificar que está soft deleted
      const reserva = await prisma.reservas.findUnique({
        where: { id: BigInt(reservaId) },
      });
      expect(reserva?.is_active).toBe(false);
      expect(reserva?.deleted_at).not.toBeNull();
      expect(reserva?.deleted_by).toBe('admin@test.com');
      expect(reserva?.delete_reason).toBe('Test de eliminación');
    });

    it('debería rechazar eliminación para usuario normal', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/reservas/${reservaId}`)
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .expect(403);
    });

    it('debería retornar 404 para reserva inexistente', async () => {
      await request(app.getHttpServer() as Server)
        .delete('/api/reservas/999999')
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(404);
    });
  });

  // =============================================
  // RESTAURAR RESERVA
  // =============================================
  describe('POST /api/reservas/:id/restore', () => {
    let reservaId: string;

    beforeAll(async () => {
      await refreshAdminToken();
      await refreshUserToken();
    });

    beforeEach(async () => {
      const reserva = await prisma.reservas.create({
        data: {
          variante_id: testVarianteId,
          usuario_id: testUserId,
          cantidad: 1,
          estado: 'pendiente',
          is_active: false,
          deleted_at: new Date(),
          deleted_by: 'test',
        },
      });
      reservaId = reserva.id.toString();
    });

    it('debería restaurar una reserva eliminada como admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/api/reservas/${reservaId}/restore`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(201);

      const body = response.body as Reserva;
      expect(body.is_active).toBe(true);

      // Verificar en BD
      const reserva = await prisma.reservas.findUnique({
        where: { id: BigInt(reservaId) },
      });
      expect(reserva?.is_active).toBe(true);
      expect(reserva?.deleted_at).toBeNull();
    });

    it('debería rechazar restauración para usuario normal', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/api/reservas/${reservaId}/restore`)
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .expect(403);
    });

    it('debería rechazar restauración de reserva no eliminada', async () => {
      // Restaurar primero
      await prisma.reservas.update({
        where: { id: BigInt(reservaId) },
        data: { is_active: true, deleted_at: null },
      });

      await request(app.getHttpServer() as Server)
        .post(`/api/reservas/${reservaId}/restore`)
        .set('Cookie', `accessToken=${adminTokens.accessToken}`)
        .expect(400);
    });
  });

  // =============================================
  // VALIDACIONES
  // =============================================
  describe('Validaciones', () => {
    beforeEach(async () => {
      await refreshUserToken();
    });

    it('debería rechazar notas muy largas (>500 caracteres)', async () => {
      const notasLargas = 'a'.repeat(501);

      await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: Number(testVarianteId),
          cantidad: 1,
          notas: notasLargas,
        })
        .expect(400);
    });

    it('debería rechazar teléfono muy largo (>50 caracteres)', async () => {
      const telefonoLargo = '1'.repeat(51);

      await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: Number(testVarianteId),
          cantidad: 1,
          telefono_contacto: telefonoLargo,
        })
        .expect(400);
    });

    it('debería rechazar estado inválido', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/reservas')
        .set('Cookie', `accessToken=${userTokens.accessToken}`)
        .send({
          variante_id: Number(testVarianteId),
          cantidad: 1,
          estado: 'invalido',
        })
        .expect(400);
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
