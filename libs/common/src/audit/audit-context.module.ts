import { Module } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ClsModule, ClsService } from 'nestjs-cls';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuditSubscriber } from './audit.subscriber';

@Module({
    imports: [
        ClsModule.forRoot({
            global: true,
            interceptor: {
                mount: true,
                setup: (cls: ClsService, context: ExecutionContext) => {
                    const req = context
                        .switchToHttp()
                        .getRequest<{ user?: JwtPayload }>();
                    const userId = req?.user?.sub;
                    if (userId) {
                        cls.set('userId', userId);
                    }
                },
            },
        }),
    ],
    providers: [AuditSubscriber],
    exports: [ClsModule, AuditSubscriber],
})
export class AuditContextModule {}
