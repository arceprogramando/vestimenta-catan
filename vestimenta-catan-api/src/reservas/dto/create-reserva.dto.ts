import {
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

enum EstadoReserva {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada',
  ENTREGADA = 'entregada',
}

export class CreateReservaDto {
  @ApiProperty({
    description: 'ID del producto a reservar',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @IsInt({ message: 'El ID del producto debe ser un número entero' })
  producto_id: number;

  @ApiPropertyOptional({
    description:
      'ID del talle (opcional si el producto no tiene talles específicos)',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @IsInt({ message: 'El ID del talle debe ser un número entero' })
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? parseInt(value) : undefined,
  )
  talle_id?: number;

  @ApiProperty({
    description: 'ID del color del producto',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @IsInt({ message: 'El ID del color debe ser un número entero' })
  @Transform(({ value }: { value: string }) => parseInt(value))
  color_id: number;

  @ApiProperty({
    description: 'Cantidad de productos a reservar',
    example: 2,
    type: 'integer',
    minimum: 1,
  })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiProperty({
    description: 'Estado de la reserva',
    enum: ['pendiente', 'confirmada', 'cancelada', 'entregada'],
    example: 'pendiente',
    default: 'pendiente',
    type: 'string',
  })
  @IsEnum(EstadoReserva, {
    message: 'El estado debe ser: pendiente, confirmada, cancelada o entregada',
  })
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  estado: string;
}
