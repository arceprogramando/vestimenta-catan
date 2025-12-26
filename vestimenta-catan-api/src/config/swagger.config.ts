import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

/**
 * Configuración de Swagger/OpenAPI para la documentación de la API.
 */
export const swaggerConfig = new DocumentBuilder()
  .setTitle('Vestimenta Catán API')
  .setDescription(
    'API REST para gestión de inventario de vestimenta térmica.\n\n' +
      '## Funcionalidades\n' +
      '- Gestión de productos y variantes (talle/color)\n' +
      '- Control de stock en tiempo real\n' +
      '- Sistema de reservas\n' +
      '- Autenticación JWT + Google OAuth\n\n' +
      '## Autenticación\n' +
      'Los endpoints protegidos requieren un token JWT en cookies httpOnly.',
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
  .addTag('Autenticación', 'Registro, login y gestión de sesiones')
  .addTag('Usuarios', 'Gestión de usuarios del sistema')
  .addTag('productos', 'Gestión de productos del catálogo')
  .addTag('producto-variantes', 'Control de stock por talle y color')
  .addTag('colores', 'Administración de colores')
  .addTag('talles', 'Gestión de talles')
  .addTag('reservas', 'Sistema de reservas')
  .build();

/**
 * Opciones de UI para Swagger.
 */
export const swaggerOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
  customSiteTitle: 'Vestimenta Catán API - Docs',
};
