/**
 * App E2E Tests
 * ==============
 *
 * Tests básicos para verificar que la aplicación arranca correctamente
 * y los endpoints funcionan según su configuración de seguridad.
 */

import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { createTestApp } from './helpers/test-utils';

describe('App (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Endpoints públicos', () => {
    it('POST /api/auth/register debería estar disponible', async () => {
      // Sin datos válidos debería dar 400 (Bad Request), no 401
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/register')
        .send({});

      // 400 significa que el endpoint está accesible pero los datos son inválidos
      expect(response.status).toBe(400);
    });

    it('POST /api/auth/login debería estar disponible', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Endpoints protegidos', () => {
    it('GET /api/usuarios debería requerir autenticación', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/usuarios')
        .expect(401);
    });

    it('GET /api/reservas debería requerir autenticación', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/reservas')
        .expect(401);
    });
  });
});
