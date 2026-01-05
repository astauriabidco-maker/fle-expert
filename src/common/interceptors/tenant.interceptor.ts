import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

import { ContextService } from '../services/context.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(private readonly contextService: ContextService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const user = (request as any).user;
        const organizationId = user?.organizationId || (request.headers['x-organization-id'] as string);

        return new Observable((subscriber) => {
            this.contextService.run(() => {
                if (organizationId) {
                    this.contextService.set('organizationId', organizationId);
                    (request as any).organizationId = organizationId;
                }

                next.handle().subscribe({
                    next: (res) => subscriber.next(res),
                    error: (err) => subscriber.error(err),
                    complete: () => subscriber.complete(),
                });
            });
        });
    }
}
