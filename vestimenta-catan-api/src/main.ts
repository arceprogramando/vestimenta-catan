import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const apiPrefix = process.env.API_PREFIX || 'api';

  // Middleware para parsear cookies
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Configurar prefijo global para todos los controladores excepto rutas específicas
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'api', method: RequestMethod.GET },
      { path: 'api/health', method: RequestMethod.GET },
    ],
  });

  const config = new DocumentBuilder()
    .setTitle('Vestimenta Catán API - Sistema de Inventario')
    .setDescription(
      'API completa para gestión de inventario de vestimenta térmica. ' +
        '\n\n🔧 **Funcionalidades principales:**' +
        '\n• Gestión de productos base' +
        '\n• Control de variantes por talle y color' +
        '\n• Administración de stock en tiempo real' +
        '\n• Gestión de colores y talles disponibles' +
        '\n• Sistema de reservas' +
        '\n• Autenticación JWT con access y refresh tokens' +
        '\n\n🔐 **Autenticación:**' +
        '\n• POST `/api/auth/register` - Registrar usuario' +
        '\n• POST `/api/auth/login` - Iniciar sesión (retorna access token)' +
        '\n• POST `/api/auth/refresh` - Refrescar tokens' +
        '\n• POST `/api/auth/logout` - Cerrar sesión' +
        '\n\n📚 **Endpoints disponibles:**' +
        '\n• `/api/productos` - CRUD de productos principales' +
        '\n• `/api/productos/stock-resumen` - Resumen de inventario' +
        '\n• `/api/producto-variantes` - CRUD de variantes de productos' +
        '\n• `/api/colores` - CRUD de colores disponibles' +
        '\n• `/api/talles` - CRUD de talles disponibles' +
        '\n• `/api/reservas` - CRUD de reservas de productos' +
        '\n• `/api/usuarios` - Gestión de usuarios (admin)',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Ingresa tu access token JWT',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Autenticación', '🔐 Auth - Registro, login y gestión de sesiones')
    .addTag('Usuarios', '👤 Usuarios - Gestión de usuarios del sistema')
    .addTag(
      'productos',
      '🛍️ Productos - Gestión de productos principales del catálogo',
    )
    .addTag(
      'producto-variantes',
      '📏 Variantes - Control detallado de stock por talle y color',
    )
    .addTag('colores', '🎨 Colores - Administración de paleta de colores')
    .addTag('talles', '📐 Talles - Gestión de talles disponibles')
    .addTag('reservas', '📋 Reservas - Sistema de reservas de productos')
    .addServer('http://localhost:3000', 'Servidor de desarrollo local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Vestimenta Catán API - Documentación',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
  console.log(
    `📚 Documentación Swagger: http://localhost:${port}/${apiPrefix}/docs`,
  );
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
