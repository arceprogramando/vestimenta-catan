import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController, ApiController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ColoresModule } from './colores/colores.module';
import { TallesModule } from './talles/talles.module';
import { ProductosModule } from './productos/productos.module';
import { ProductoVariantesModule } from './producto-variantes/producto-variantes.module';
import { ReservasModule } from './reservas/reservas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ColoresModule,
    TallesModule,
    ProductosModule,
    ProductoVariantesModule,
    ReservasModule,
  ],
  controllers: [AppController, ApiController],
  providers: [AppService],
})
export class AppModule {}
