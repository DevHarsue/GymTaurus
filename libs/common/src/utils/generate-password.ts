import { randomInt } from 'crypto';

const UPPERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERS = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIALS = '!@#$%^&*';
const ALL = UPPERS + LOWERS + DIGITS + SPECIALS;

function pick(charset: string): string {
    return charset[randomInt(0, charset.length)]!;
}

function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1);
        [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
}

/**
 * Genera una contraseña que SIEMPRE cumple las reglas de IsTaurusPassword:
 * - longitud >= 8 (default 12)
 * - >= 2 digitos
 * - >= 1 mayuscula
 * - >= 1 minuscula
 * - >= 1 caracter especial
 */
export function generateCompliantPassword(length = 12): string {
    const len = length < 8 ? 8 : length;
    const required: string[] = [
        pick(UPPERS),
        pick(LOWERS),
        pick(DIGITS),
        pick(DIGITS),
        pick(SPECIALS),
    ];
    while (required.length < len) required.push(pick(ALL));
    return shuffle(required).join('');
}
