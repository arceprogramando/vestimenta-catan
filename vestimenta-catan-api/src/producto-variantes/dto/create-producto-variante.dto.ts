import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductoVarianteDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 1,
    type: 'integer',
  })
  @IsInt({ message: 'El ID del producto debe ser un número entero' })
  producto_id: number;

  @ApiPropertyOptional({
    description: 'ID del talle (opcional)',
    example: 1,
    type: 'integer',
  })
  @IsInt({ message: 'El ID del talle debe ser un número entero' })
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? parseInt(value) : undefined,
  )
  talle_id?: number;

  @ApiProperty({
    description: 'ID del color',
    example: 1,
    type: 'integer',
  })
  @IsInt({ message: 'El ID del color debe ser un número entero' })
  @Transform(({ value }: { value: string }) => parseInt(value))
  color_id: number;

  @ApiProperty({
    description: 'Cantidad disponible',
    example: 10,
    minimum: 0,
    type: 'integer',
  })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  cantidad: number;
}
