import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
    @ApiProperty({ example: 'admin@taurus.gym' })
    @IsEmail()
    email!: string;

    // Sin politica de longitud aqui: en el login una clave corta e incorrecta
    // debe responder 401 "Contrasena incorrecta", no un 400 de validacion.
    @ApiProperty({ example: 'Admin123!' })
    @IsString()
    @MinLength(1)
    password!: string;
}
