import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum Genero {
  mujer = 'mujer',
  hombre = 'hombre',
  niños_unisex = 'ni_os_unisex',
}

export class CreateProductoDto {
  @ApiProperty({
    description: 'ID único del producto',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @IsInt({ message: 'El ID debe ser un número entero' })
  id: number;

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
    enum: ['mujer', 'hombre', 'ni_os_unisex'],
    example: 'mujer',
    type: 'string',
  })
  @IsEnum(Genero, {
    message: 'El género debe ser: mujer, hombre o ni_os_unisex',
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
}
