import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const auth = request.headers.authorization;
        if (!auth) {
            return true;
        }
        return super.canActivate(context);
    }

    handleRequest<TUser = any>(_err: any, user: any): TUser {
        return user || null;
    }
}
