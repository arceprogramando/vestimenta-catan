import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración global de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Vestimenta Catán API')
    .setDescription(
      'API para gestión de inventario de vestimenta - Sistema Catán',
    )
    .setVersion('1.0')
    .addTag('colores', 'Gestión de colores disponibles')
    .addTag('talles', 'Gestión de talles (S, M, L, XL, etc.)')
    .addTag('productos', 'Gestión de productos (camisetas, pantalones, etc.)')
    .addTag(
      'producto-variantes',
      'Variantes de productos con stock por talle y color',
    )
    .addTag('reservas', 'Gestión de reservas de productos')
    .addServer('http://localhost:3000', 'Servidor de desarrollo')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
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
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
