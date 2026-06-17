import { CEDULA_REGEX } from './cedula.validator';

describe('CEDULA_REGEX', () => {
    describe('acepta cedulas validas', () => {
        it('acepta 7 digitos', () => {
            expect(CEDULA_REGEX.test('1234567')).toBe(true);
        });

        it('acepta 8 digitos', () => {
            expect(CEDULA_REGEX.test('12345678')).toBe(true);
        });

        it('acepta 9 digitos', () => {
            expect(CEDULA_REGEX.test('123456789')).toBe(true);
        });

        it('acepta 10 digitos', () => {
            expect(CEDULA_REGEX.test('1234567890')).toBe(true);
        });
    });

    describe('rechaza cedulas invalidas', () => {
        it('rechaza menos de 7 digitos', () => {
            expect(CEDULA_REGEX.test('123456')).toBe(false);
        });

        it('rechaza mas de 10 digitos', () => {
            expect(CEDULA_REGEX.test('12345678901')).toBe(false);
        });

        it('rechaza cadena vacia', () => {
            expect(CEDULA_REGEX.test('')).toBe(false);
        });

        it('rechaza letras', () => {
            expect(CEDULA_REGEX.test('1234567a')).toBe(false);
        });

        it('rechaza espacios', () => {
            expect(CEDULA_REGEX.test('1234 567')).toBe(false);
        });

        it('rechaza puntos', () => {
            expect(CEDULA_REGEX.test('1.234.567')).toBe(false);
        });

        it('rechaza guiones', () => {
            expect(CEDULA_REGEX.test('1234-567')).toBe(false);
        });

        it('rechaza signo de mas', () => {
            expect(CEDULA_REGEX.test('+1234567')).toBe(false);
        });
    });
});
