import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
import {
    DEVICE_HEARTBEAT_JOB_NAME,
    DEVICE_HEARTBEAT_QUEUE_NAME,
} from '../../application/constants/device-heartbeat.constants';

@Injectable()
export class AccessJobsScheduler implements OnModuleInit {
    constructor(
        @InjectQueue(DEVICE_HEARTBEAT_QUEUE_NAME)
        private readonly accessJobsQueue: Queue,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.accessJobsQueue.add(
            DEVICE_HEARTBEAT_JOB_NAME,
            {},
            {
                jobId: DEVICE_HEARTBEAT_JOB_NAME,
                repeat: {
                    every: 5 * 60 * 1000,
                },
                removeOnComplete: true,
            },
        );
    }
}
