import { Module } from '@nestjs/common';
import { TallesService } from './talles.service';
import { TallesController } from './talles.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TallesController],
  providers: [TallesService],
  exports: [TallesService],
})
export class TallesModule {}
