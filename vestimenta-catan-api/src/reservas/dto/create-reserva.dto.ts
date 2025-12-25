import { IsInt, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum EstadoReserva {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
  COMPLETADO = 'completado',
}

export class CreateReservaDto {
  @ApiProperty({
    description: 'ID de la variante del producto (producto + talle + color)',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @IsInt({ message: 'El ID de la variante debe ser un número entero' })
  variante_id: number;

  @ApiPropertyOptional({
    description: 'ID del usuario que realiza la reserva',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @IsInt({ message: 'El ID del usuario debe ser un número entero' })
  @IsOptional()
  usuario_id?: number;

  @ApiProperty({
    description: 'Cantidad de productos a reservar',
    example: 2,
    type: 'integer',
    minimum: 1,
  })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiPropertyOptional({
    description: 'Estado de la reserva',
    enum: ['pendiente', 'confirmado', 'cancelado', 'completado'],
    example: 'pendiente',
    default: 'pendiente',
    type: 'string',
  })
  @IsEnum(EstadoReserva, {
    message:
      'El estado debe ser: pendiente, confirmado, cancelado o completado',
  })
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales de la reserva',
    example: 'Entregar antes del mediodía',
    type: 'string',
  })
  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notas?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto del cliente',
    example: '+54 9 2972 123456',
    type: 'string',
  })
  @IsString({ message: 'El teléfono debe ser texto' })
  @IsOptional()
  telefono_contacto?: string;
}
