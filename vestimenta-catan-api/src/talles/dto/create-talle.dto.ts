import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
  nombre_talle: string;
}
