import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';

@Injectable()
@Processor('access-jobs')
export class AccessProcessor {
    @Process('cleanup-open-sessions')
    async handleCleanupOpenSessions(): Promise<void> {
        return Promise.resolve();
    }
}
