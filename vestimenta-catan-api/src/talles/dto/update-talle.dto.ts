import { PartialType } from '@nestjs/swagger';
import { CreateTalleDto } from './create-talle.dto';

export class UpdateTalleDto extends PartialType(CreateTalleDto) {}
