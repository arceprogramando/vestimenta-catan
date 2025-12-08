import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @ApiPropertyOptional({
    description: 'Estado activo del usuario',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un booleano' })
  is_active?: boolean;
}
