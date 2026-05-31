import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Vista read-only sobre auth.users del schema de autenticacion.
 * Se usa solo para enriquecer audit_log con el email del actor via JOIN.
 * NO escribir desde este servicio: el dueno es auth-service.
 */
@Entity({ schema: 'auth', name: 'users' })
export class AuthUserEntity {
    @PrimaryColumn({ type: 'uuid' })
    id!: string;

    @Column({ type: 'varchar' })
    email!: string;
}
