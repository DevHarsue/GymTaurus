import { Inject, Injectable } from '@nestjs/common';
import { RegisterAccessDto } from '../../api/dtos/register-access.dto';
import {
    type AccessLogModel,
    type AccessLogRepositoryPort,
} from '../ports/access-log-repository.port';
import { type EventPublisherPort } from '../ports/event-publisher.port';

@Injectable()
export class AccessService {
    constructor(
        @Inject('AccessLogRepositoryPort')
        private readonly accessLogRepository: AccessLogRepositoryPort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async register(payload: RegisterAccessDto): Promise<AccessLogModel> {
        const accessLog = await this.accessLogRepository.create(payload);
        await this.eventPublisher.publish('access.log.created', accessLog);
        return accessLog;
    }
}
