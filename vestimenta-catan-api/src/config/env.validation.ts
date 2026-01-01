import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  validateSync,
} from 'class-validator';

/**
 * Clase que define y valida las variables de entorno requeridas.
 * Si una variable no tiene @IsOptional(), es REQUERIDA y la app no arrancará sin ella.
 */
export class EnvironmentVariables {
  // === App Config ===

  @IsNumber({}, { message: 'PORT debe ser un número' })
  @IsOptional()
  PORT: number = 3000;

  @IsString({ message: 'NODE_ENV debe ser un string' })
  @IsIn(['development', 'production', 'test'], {
    message: 'NODE_ENV debe ser: development, production o test',
  })
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsString({ message: 'API_PREFIX debe ser un string' })
  @IsOptional()
  API_PREFIX: string = 'api';

  // === Database (REQUERIDO) ===

  @IsString({ message: 'DATABASE_URL es requerida' })
  DATABASE_URL: string;

  // === CORS (REQUERIDO) ===

  @IsString({ message: 'CORS_ORIGIN es requerida (ej: http://localhost:3001)' })
  CORS_ORIGIN: string;

  // === JWT (REQUERIDOS) ===

  @IsString({ message: 'JWT_ACCESS_SECRET es requerida' })
  JWT_ACCESS_SECRET: string;

  @IsString({ message: 'JWT_REFRESH_SECRET es requerida' })
  JWT_REFRESH_SECRET: string;

  @IsString({ message: 'JWT_ACCESS_EXPIRES_IN debe ser un string' })
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString({ message: 'JWT_REFRESH_EXPIRES_IN debe ser un string' })
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  // === Security ===

  @IsNumber({}, { message: 'BCRYPT_SALT_ROUNDS debe ser un número' })
  @IsOptional()
  BCRYPT_SALT_ROUNDS: number = 12;

  // === Google OAuth (Opcional) ===

  @IsString({ message: 'GOOGLE_CLIENT_ID debe ser un string' })
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  // === Logging ===

  @IsString({ message: 'LOG_LEVEL debe ser un string' })
  @IsIn(['error', 'warn', 'info', 'debug', 'verbose'], {
    message: 'LOG_LEVEL debe ser: error, warn, info, debug o verbose',
  })
  @IsOptional()
  LOG_LEVEL?: string;

  // === Rate Limiting ===

  @IsNumber({}, { message: 'RATE_LIMIT_TTL debe ser un número (ms)' })
  @IsOptional()
  RATE_LIMIT_TTL: number = 60000;

  @IsNumber({}, { message: 'RATE_LIMIT_LIMIT debe ser un número' })
  @IsOptional()
  RATE_LIMIT_LIMIT: number = 100;

  // === Audit ===

  @IsString({ message: 'AUDIT_ENABLED debe ser un string (true/false)' })
  @IsIn(['true', 'false'], {
    message: 'AUDIT_ENABLED debe ser: true o false',
  })
  @IsOptional()
  AUDIT_ENABLED: string = 'true';

  @IsNumber({}, { message: 'AUDIT_RETENTION_DAYS debe ser un número' })
  @IsOptional()
  AUDIT_RETENTION_DAYS: number = 90;
}

/**
 * Función de validación para ConfigModule.
 * Si faltan variables requeridas, lanza un error descriptivo y la app no arranca.
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const missingVars = errors
      .map((error) => {
        const constraints = Object.values(error.constraints || {});
        return `  - ${error.property}: ${constraints.join(', ')}`;
      })
      .join('\n');

    throw new Error(
      `\n❌ Error de configuración - Faltan variables de entorno:\n${missingVars}\n\nRevisa tu archivo .env\n`,
    );
  }

  return validatedConfig;
}
