import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@example.com',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'Juan',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser un texto' })
  @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
  apellido?: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario',
    example: 'user',
    enum: ['user', 'admin'],
    default: 'user',
  })
  @IsOptional()
  @IsEnum(['user', 'admin'], { message: 'El rol debe ser user o admin' })
  rol?: 'user' | 'admin';
}
