import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';

@Injectable()
@Processor('members-jobs')
export class MembersProcessor {
    @Process('renewals')
    async handleRenewals(): Promise<void> {
        return Promise.resolve();
    }
}
