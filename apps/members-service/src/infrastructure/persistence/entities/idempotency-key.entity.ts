import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * Clave de idempotencia para escrituras del cliente offline-first.
 * El movil envia `Idempotency-Key` (UUID) por operacion; la primera
 * ejecucion guarda la respuesta y los replays la devuelven cacheada.
 */
@Entity({ schema: 'members', name: 'idempotency_keys' })
export class IdempotencyKeyEntity {
    @PrimaryColumn('uuid')
    key!: string;

    @Column({ type: 'varchar', length: 120 })
    endpoint!: string;

    @Column({ type: 'uuid', name: 'user_id', nullable: true })
    userId!: string | null;

    /** 0 = reserva en curso (request en vuelo); >0 = respuesta final. */
    @Column({ type: 'int', name: 'response_status' })
    responseStatus!: number;

    @Column({ type: 'jsonb', name: 'response_body', nullable: true })
    responseBody!: object | null;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;
}
