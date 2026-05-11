import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MinLength } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REGEX =
  /^(?=(?:.*\d){2,})(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]).{8,}$/;

export function IsTaurusPassword(message?: string) {
  return applyDecorators(
    IsString({ message: 'La contrasena debe ser una cadena de texto' }),
    MinLength(PASSWORD_MIN_LENGTH, {
      message: `La contrasena debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    }),
    Matches(PASSWORD_REGEX, {
      message:
        message ??
        'La contrasena debe incluir al menos 2 numeros, 1 mayuscula, 1 minuscula y 1 caracter especial',
    }),
  );
}
