import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import {
    DataSource,
    EventSubscriber,
    type EntitySubscriberInterface,
    type InsertEvent,
    type QueryRunner,
    type RemoveEvent,
    type UpdateEvent,
} from 'typeorm';

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
    constructor(
        @InjectDataSource() dataSource: DataSource,
        private readonly cls: ClsService,
    ) {
        dataSource.subscribers.push(this);
    }

    async beforeInsert(event: InsertEvent<unknown>): Promise<void> {
        await this.applyActor(event.queryRunner);
    }

    async beforeUpdate(event: UpdateEvent<unknown>): Promise<void> {
        await this.applyActor(event.queryRunner);
    }

    async beforeRemove(event: RemoveEvent<unknown>): Promise<void> {
        await this.applyActor(event.queryRunner);
    }

    private async applyActor(queryRunner: QueryRunner): Promise<void> {
        const userId = this.cls.get<string | undefined>('userId') ?? '';
        // is_local = false → session-level. Siempre seteamos (vacío si no hay actor)
        // para no heredar el actor de la request previa sobre el mismo connection del pool.
        await queryRunner.query(
            `SELECT set_config('app.current_user_id', $1, false)`,
            [userId],
        );
    }
}
