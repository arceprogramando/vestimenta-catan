import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import {
  WINSTON_MODULE_NEST_PROVIDER,
  WINSTON_MODULE_PROVIDER,
} from 'nest-winston';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { Logger } from 'winston';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';
import { SanitizePipe } from './common/pipes';
import { swaggerConfig, swaggerOptions } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Obtener ConfigService (variables ya validadas en app.module.ts)
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Winston como logger de la aplicación
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Exception filter global con logging
  const winstonLogger = app.get<Logger>(WINSTON_MODULE_PROVIDER);
  app.useGlobalFilters(new GlobalExceptionFilter(winstonLogger));

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Compresión de respuestas
  app.use(compression());

  // Parser de cookies
  app.use(cookieParser());

  // Pipes globales: sanitización + validación
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS (corsOrigin ya viene validado del .env)
  app.enableCors({
    origin: corsOrigin?.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Prefijo global
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'api', method: RequestMethod.GET },
      { path: 'api/health', method: RequestMethod.GET },
    ],
  });

  // Swagger (solo en desarrollo)
  if (!isProduction) {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, swaggerOptions);
  }

  await app.listen(port);

  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
  if (!isProduction) {
    console.log(
      `📚 Documentación Swagger: http://localhost:${port}/${apiPrefix}/docs`,
    );
  }
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
