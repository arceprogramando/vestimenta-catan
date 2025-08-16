import { Module } from '@nestjs/common';
import { ProductoVariantesService } from './producto-variantes.service';
import { ProductoVariantesController } from './producto-variantes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductoVariantesController],
  providers: [ProductoVariantesService],
  exports: [ProductoVariantesService],
})
export class ProductoVariantesModule {}
