import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductoVarianteDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 1,
    type: 'integer',
  })
  @IsInt()
  producto_id: number;

  @ApiPropertyOptional({
    description: 'ID del talle (opcional)',
    example: 1,
    type: 'integer',
  })
  @IsInt()
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
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value))
  color_id: number;

  @ApiProperty({
    description: 'Cantidad disponible',
    example: 10,
    minimum: 0,
    type: 'integer',
  })
  @IsInt()
  @Min(0)
  cantidad: number;
}
