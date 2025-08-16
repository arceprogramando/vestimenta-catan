import { IsString, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateColorDto {
  @ApiProperty({
    description: 'Nombre del color',
    example: 'Rojo',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del color es obligatorio' })
  @Length(1, 100, { message: 'El nombre debe tener entre 1 y 100 caracteres' })
  @Transform(({ value }: { value: string }) => value?.trim())
  nombre: string;
}
