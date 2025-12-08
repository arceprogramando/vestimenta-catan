import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'ID del usuario', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@example.com',
  })
  email: string;

  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  nombre: string | null;

  @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
  apellido: string | null;

  @ApiProperty({
    description: 'Rol del usuario',
    example: 'user',
    enum: ['user', 'admin'],
  })
  rol: string;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Access token JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Tiempo de expiración del access token en segundos',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Tipo de token',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Datos del usuario',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Operación exitosa',
  })
  message: string;
}
