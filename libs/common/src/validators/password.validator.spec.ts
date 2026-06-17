import {
    PASSWORD_MIN_LENGTH,
    PASSWORD_REGEX,
} from './password.validator';

describe('PASSWORD_MIN_LENGTH', () => {
    it('es 8', () => {
        expect(PASSWORD_MIN_LENGTH).toBe(8);
    });
});

describe('PASSWORD_REGEX', () => {
    describe('acepta passwords validos', () => {
        it('acepta password con todos los requisitos', () => {
            expect(PASSWORD_REGEX.test('Abc12345!')).toBe(true);
        });

        it('acepta password largo', () => {
            expect(PASSWORD_REGEX.test('MiClaveSegura12@')).toBe(true);
        });

        it('acepta password con varios especiales', () => {
            expect(PASSWORD_REGEX.test('Ab12!@#$')).toBe(true);
        });

        it('acepta password con muchos digitos', () => {
            expect(PASSWORD_REGEX.test('Ab123456!')).toBe(true);
        });
    });

    describe('rechaza passwords invalidos', () => {
        it('rechaza si no tiene mayuscula', () => {
            expect(PASSWORD_REGEX.test('abc12345!')).toBe(false);
        });

        it('rechaza si no tiene minuscula', () => {
            expect(PASSWORD_REGEX.test('ABC12345!')).toBe(false);
        });

        it('rechaza si tiene solo 1 digito', () => {
            expect(PASSWORD_REGEX.test('Abcdefg1!')).toBe(false);
        });

        it('rechaza si no tiene digitos', () => {
            expect(PASSWORD_REGEX.test('Abcdefgh!')).toBe(false);
        });

        it('rechaza si no tiene caracter especial', () => {
            expect(PASSWORD_REGEX.test('Abc123456')).toBe(false);
        });

        it('rechaza si tiene menos de 8 caracteres', () => {
            expect(PASSWORD_REGEX.test('Ab12!')).toBe(false);
        });

        it('rechaza cadena vacia', () => {
            expect(PASSWORD_REGEX.test('')).toBe(false);
        });

        it('rechaza solo numeros', () => {
            expect(PASSWORD_REGEX.test('12345678')).toBe(false);
        });

        it('rechaza solo letras', () => {
            expect(PASSWORD_REGEX.test('Abcdefgh')).toBe(false);
        });
    });

    describe('caracteres especiales permitidos', () => {
        it('acepta exclamacion', () => {
            expect(PASSWORD_REGEX.test('Abc12345!')).toBe(true);
        });

        it('acepta arroba', () => {
            expect(PASSWORD_REGEX.test('Abc12345@')).toBe(true);
        });

        it('acepta numeral', () => {
            expect(PASSWORD_REGEX.test('Abc12345#')).toBe(true);
        });

        it('acepta dolar', () => {
            expect(PASSWORD_REGEX.test('Abc12345$')).toBe(true);
        });

        it('acepta guion bajo', () => {
            expect(PASSWORD_REGEX.test('Abc12345_')).toBe(true);
        });
    });
});
