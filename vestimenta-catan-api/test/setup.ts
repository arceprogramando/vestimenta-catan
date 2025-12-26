/**
 * E2E Test Setup
 * ===============
 * Este archivo se ejecuta antes de cada archivo de test E2E.
 *
 * Responsabilidades:
 * 1. Cargar variables de entorno desde .env.test
 * 2. Configurar timeouts globales
 * 3. Silenciar logs innecesarios durante tests
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env.test ANTES de que NestJS inicie
dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
});

// Verificar que se cargaron las variables correctas
if (process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  NODE_ENV no es "test". Asegurate de que .env.test existe.');
}

// Silenciar console.log durante tests (mantener warn y error)
if (process.env.NODE_ENV === 'test') {
  global.console.log = jest.fn();
}
