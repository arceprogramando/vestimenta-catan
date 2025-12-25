import { PartialType } from '@nestjs/swagger';
import { CreateReservaDto } from './create-reserva.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReservaDto extends PartialType(CreateReservaDto) {
  @ApiPropertyOptional({
    description:
      'Motivo de cancelación (requerido si el estado cambia a cancelado)',
    example: 'El cliente solicitó cancelar el pedido',
    type: 'string',
  })
  @IsString({ message: 'El motivo debe ser texto' })
  @IsOptional()
  motivo_cancelacion?: string;
}
