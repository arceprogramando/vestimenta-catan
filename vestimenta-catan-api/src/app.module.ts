import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController, ApiController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ColoresModule } from './colores/colores.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductoVariantesModule } from './producto-variantes/producto-variantes.module';
import { ProductosModule } from './productos/productos.module';
import { ReservasModule } from './reservas/reservas.module';
import { TallesModule } from './talles/talles.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting global: 100 requests por minuto por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ColoresModule,
    TallesModule,
    ProductosModule,
    ProductoVariantesModule,
    ReservasModule,
  ],
  controllers: [AppController, ApiController],
  providers: [
    AppService,
    // Guards globales - orden importante: throttling, autenticación, autorización
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
