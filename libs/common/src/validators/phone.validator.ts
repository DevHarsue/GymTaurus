import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export const PHONE_REGEX = /^\+?58(412|414|416|418|422|424|426)\d{7}$/;

// Normaliza el telefono eliminando el '+' inicial opcional antes de validar/persistir.
export const normalizePhone = (value: unknown): unknown =>
  typeof value === 'string' ? value.replace(/^\+/, '') : value;

export function IsTaurusPhone(message?: string) {
  return applyDecorators(
    Transform(({ value }) => normalizePhone(value)),
    IsString({ message: 'El telefono debe ser una cadena de texto' }),
    Matches(PHONE_REGEX, {
      message:
        message ??
        'Telefono invalido. Formato esperado: 58 + prefijo (412, 414, 416, 418, 422, 424, 426) + 7 digitos. Ej: 584141771490',
    }),
  );
}
