/**
 * Health E2E Tests
 * =================
 *
 * Tests End-to-End para los endpoints de health check.
 * Verifican liveness, readiness e info endpoints.
 */

import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { createTestApp } from './helpers/test-utils';

interface HealthResponse {
  status: string;
  info?: Record<string, { status: string; responseTime?: string }>;
  error?: Record<string, { status: string; error?: string }>;
  details?: Record<string, { status: string }>;
}

interface InfoResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  node: string;
}

describe('Health (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  // =============================================
  // LIVENESS PROBE (/health)
  // =============================================
  describe('GET /api/health (Liveness)', () => {
    it('debería responder 200 OK cuando el proceso está vivo', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('debería ser accesible sin autenticación (público)', async () => {
      // No enviamos cookies ni headers de auth
      await request(app.getHttpServer() as Server)
        .get('/api/health')
        .expect(200);
    });
  });

  // =============================================
  // READINESS PROBE (/health/ready)
  // =============================================
  describe('GET /api/health/ready (Readiness)', () => {
    it('debería responder 200 OK cuando BD y memoria están OK', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/ready')
        .expect(200);

      const body = response.body as HealthResponse;
      expect(body.status).toBe('ok');
    });

    it('debería incluir estado de la base de datos', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/ready')
        .expect(200);

      const body = response.body as HealthResponse;
      expect(body.info).toHaveProperty('database');
      expect(body.info?.database.status).toBe('up');
    });

    it('debería incluir tiempo de respuesta de la BD', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/ready')
        .expect(200);

      const body = response.body as HealthResponse;
      expect(body.info?.database).toHaveProperty('responseTime');
      expect(body.info?.database.responseTime).toMatch(/^\d+ms$/);
    });

    it('debería incluir estado de la memoria heap', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/ready')
        .expect(200);

      const body = response.body as HealthResponse;
      expect(body.info).toHaveProperty('memory_heap');
      expect(body.info?.memory_heap.status).toBe('up');
    });

    it('debería incluir sección details con todos los indicadores', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/ready')
        .expect(200);

      const body = response.body as HealthResponse;
      expect(body.details).toHaveProperty('database');
      expect(body.details).toHaveProperty('memory_heap');
    });

    it('debería ser accesible sin autenticación (público)', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/health/ready')
        .expect(200);
    });
  });

  // =============================================
  // INFO ENDPOINT (/health/info)
  // =============================================
  describe('GET /api/health/info', () => {
    it('debería responder 200 OK', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/health/info')
        .expect(200);
    });

    it('debería incluir status ok', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/info')
        .expect(200);

      const body = response.body as InfoResponse;
      expect(body.status).toBe('ok');
    });

    it('debería incluir timestamp ISO 8601', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/info')
        .expect(200);

      const body = response.body as InfoResponse;
      expect(body.timestamp).toBeDefined();
      // Verificar formato ISO 8601
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    });

    it('debería incluir uptime en segundos', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/info')
        .expect(200);

      const body = response.body as InfoResponse;
      expect(body.uptime).toBeDefined();
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThan(0);
    });

    it('debería incluir versión del servicio', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/info')
        .expect(200);

      const body = response.body as InfoResponse;
      expect(body.version).toBeDefined();
    });

    it('debería incluir ambiente (development/production)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/info')
        .expect(200);

      const body = response.body as InfoResponse;
      expect(body.environment).toBeDefined();
      expect(['development', 'production', 'test']).toContain(body.environment);
    });

    it('debería incluir versión de Node.js', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/health/info')
        .expect(200);

      const body = response.body as InfoResponse;
      expect(body.node).toBeDefined();
      expect(body.node).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    it('debería ser accesible sin autenticación (público)', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/health/info')
        .expect(200);
    });
  });
});
