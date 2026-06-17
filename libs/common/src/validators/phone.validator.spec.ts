import { PHONE_REGEX, normalizePhone } from './phone.validator';

describe('PHONE_REGEX', () => {
    describe('acepta telefonos validos por prefijo', () => {
        it('acepta prefijo 412', () => {
            expect(PHONE_REGEX.test('584121234567')).toBe(true);
        });

        it('acepta prefijo 414', () => {
            expect(PHONE_REGEX.test('584141234567')).toBe(true);
        });

        it('acepta prefijo 416', () => {
            expect(PHONE_REGEX.test('584161234567')).toBe(true);
        });

        it('acepta prefijo 418', () => {
            expect(PHONE_REGEX.test('584181234567')).toBe(true);
        });

        it('acepta prefijo 422', () => {
            expect(PHONE_REGEX.test('584221234567')).toBe(true);
        });

        it('acepta prefijo 424', () => {
            expect(PHONE_REGEX.test('584241234567')).toBe(true);
        });

        it('acepta prefijo 426', () => {
            expect(PHONE_REGEX.test('584261234567')).toBe(true);
        });

        it('acepta con signo de mas inicial', () => {
            expect(PHONE_REGEX.test('+584141234567')).toBe(true);
        });
    });

    describe('rechaza telefonos invalidos', () => {
        it('rechaza prefijo no permitido (415)', () => {
            expect(PHONE_REGEX.test('584151234567')).toBe(false);
        });

        it('rechaza pais distinto (no empieza con 58)', () => {
            expect(PHONE_REGEX.test('574141234567')).toBe(false);
        });

        it('rechaza menos de 7 digitos finales', () => {
            expect(PHONE_REGEX.test('58414123456')).toBe(false);
        });

        it('rechaza mas de 7 digitos finales', () => {
            expect(PHONE_REGEX.test('5841412345678')).toBe(false);
        });

        it('rechaza letras', () => {
            expect(PHONE_REGEX.test('58414abc4567')).toBe(false);
        });

        it('rechaza cadena vacia', () => {
            expect(PHONE_REGEX.test('')).toBe(false);
        });

        it('rechaza espacios intermedios', () => {
            expect(PHONE_REGEX.test('58 414 1234567')).toBe(false);
        });
    });
});

describe('normalizePhone', () => {
    it('elimina el signo de mas inicial', () => {
        expect(normalizePhone('+584141234567')).toBe('584141234567');
    });

    it('deja igual si no tiene signo de mas', () => {
        expect(normalizePhone('584141234567')).toBe('584141234567');
    });

    it('no toca signos de mas que no sean el primero', () => {
        expect(normalizePhone('58414+234567')).toBe('58414+234567');
    });

    it('devuelve cadena vacia tal cual', () => {
        expect(normalizePhone('')).toBe('');
    });

    it('devuelve numeros tal cual (no es string)', () => {
        expect(normalizePhone(584141234567)).toBe(584141234567);
    });

    it('devuelve null tal cual', () => {
        expect(normalizePhone(null)).toBe(null);
    });

    it('devuelve undefined tal cual', () => {
        expect(normalizePhone(undefined)).toBe(undefined);
    });
});
