import { PASSWORD_REGEX } from '../validators/password.validator';
import { generateCompliantPassword } from './generate-password';

describe('generateCompliantPassword', () => {
    describe('longitud', () => {
        it('usa longitud 12 por defecto', () => {
            expect(generateCompliantPassword()).toHaveLength(12);
        });

        it('respeta longitud personalizada de 16', () => {
            expect(generateCompliantPassword(16)).toHaveLength(16);
        });

        it('respeta longitud personalizada de 20', () => {
            expect(generateCompliantPassword(20)).toHaveLength(20);
        });

        it('usa 8 como minimo si se pide menos', () => {
            expect(generateCompliantPassword(4)).toHaveLength(8);
        });

        it('usa 8 como minimo si se pide 0', () => {
            expect(generateCompliantPassword(0)).toHaveLength(8);
        });

        it('respeta longitud exacta de 8 (limite inferior)', () => {
            expect(generateCompliantPassword(8)).toHaveLength(8);
        });
    });

    describe('cumplimiento de reglas (PASSWORD_REGEX)', () => {
        it('siempre genera un password que cumple PASSWORD_REGEX', () => {
            for (let i = 0; i < 100; i++) {
                const password = generateCompliantPassword();
                expect(PASSWORD_REGEX.test(password)).toBe(true);
            }
        });

        it('cumple las reglas en longitud minima (8)', () => {
            for (let i = 0; i < 100; i++) {
                const password = generateCompliantPassword(8);
                expect(PASSWORD_REGEX.test(password)).toBe(true);
            }
        });

        it('cumple las reglas en longitud grande (32)', () => {
            for (let i = 0; i < 100; i++) {
                const password = generateCompliantPassword(32);
                expect(PASSWORD_REGEX.test(password)).toBe(true);
            }
        });
    });

    describe('aleatoriedad', () => {
        it('genera passwords distintos en llamadas sucesivas', () => {
            const a = generateCompliantPassword();
            const b = generateCompliantPassword();
            expect(a).not.toBe(b);
        });
    });
});
