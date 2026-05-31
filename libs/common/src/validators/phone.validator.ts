import { applyDecorators } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';

// TODO: confirmar con usuario si se debe normalizar (strip '+') antes de persistir
export const PHONE_REGEX = /^\+?58(412|414|416|418|422|424|426)\d{7}$/;

export function IsTaurusPhone(message?: string) {
  return applyDecorators(
    IsString({ message: 'El telefono debe ser una cadena de texto' }),
    Matches(PHONE_REGEX, {
      message:
        message ??
        'Telefono invalido. Formato esperado: 58 + prefijo (412, 414, 416, 418, 422, 424, 426) + 7 digitos. Ej: 584141771490',
    }),
  );
}
