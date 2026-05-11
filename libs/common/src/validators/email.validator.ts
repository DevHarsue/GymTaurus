import { applyDecorators } from '@nestjs/common';
import { IsEmail, MaxLength } from 'class-validator';

export function IsTaurusEmail(message?: string) {
  return applyDecorators(
    IsEmail(
      {},
      { message: message ?? 'Email invalido' },
    ),
    MaxLength(254, { message: 'El email no puede superar 254 caracteres' }),
  );
}
