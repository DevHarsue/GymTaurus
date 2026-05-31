import { applyDecorators } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';

export const CEDULA_REGEX = /^\d{7,10}$/;

export function IsTaurusCedula(message?: string) {
  return applyDecorators(
    IsString({ message: 'La cedula debe ser una cadena de texto' }),
    Matches(CEDULA_REGEX, {
      message:
        message ?? 'Cedula invalida. Debe contener solo numeros, entre 7 y 10 digitos',
    }),
  );
}
