import { IsString, IsNotEmpty, Length, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTalleDto {
  @ApiProperty({
    description: 'Nombre del talle',
    example: 'M',
    minLength: 1,
    maxLength: 50,
    type: 'string',
  })
  @IsString({ message: 'El nombre del talle debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del talle es obligatorio' })
  @Length(1, 50, {
    message: 'El nombre del talle debe tener entre 1 y 50 caracteres',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  nombre: string;

  @ApiPropertyOptional({
    description: 'Orden del talle para ordenación (S=1, M=2, L=3, etc.)',
    example: 2,
    type: 'integer',
    minimum: 0,
  })
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden debe ser mayor o igual a 0' })
  @IsOptional()
  orden?: number;
}
