import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum Genero {
  mujer = 'mujer',
  hombre = 'hombre',
  ninios = 'ninios',
}

export class CreateProductoDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Camiseta básica',
    maxLength: 255,
    minLength: 1,
    type: 'string',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del producto',
    example: 'Camiseta de algodón 100%, cómoda y transpirable',
    maxLength: 500,
    type: 'string',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Género del producto',
    enum: ['mujer', 'hombre', 'ninios'],
    example: 'mujer',
    type: 'string',
  })
  @IsEnum(Genero, {
    message: 'El género debe ser: mujer, hombre o ninios',
  })
  genero: Genero;

  @ApiPropertyOptional({
    description: 'URL de la imagen miniatura del producto',
    example: 'https://example.com/images/camiseta-basica.jpg',
    type: 'string',
    format: 'uri',
  })
  @IsString({ message: 'La URL debe ser una cadena de texto' })
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({
    description: 'Precio de venta del producto',
    example: 15000.00,
    type: 'number',
  })
  @IsOptional()
  precio?: number;
}
