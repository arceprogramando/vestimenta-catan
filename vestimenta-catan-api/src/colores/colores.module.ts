import { Module } from '@nestjs/common';
import { ColoresService } from './colores.service';
import { ColoresController } from './colores.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ColoresController],
  providers: [ColoresService],
})
export class ColoresModule {}
