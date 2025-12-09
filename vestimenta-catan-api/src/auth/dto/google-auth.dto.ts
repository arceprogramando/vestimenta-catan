import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Token de credencial de Google (idToken)',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'El credential debe ser un texto' })
  @IsNotEmpty({ message: 'El credential es requerido' })
  credential: string;
}
