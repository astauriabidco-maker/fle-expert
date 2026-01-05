import { Module } from '@nestjs/common';
import { SecurityService } from './services/security.service';
import { TenantInterceptor } from './interceptors/tenant.interceptor';
import { RolesGuard } from './guards/roles.guard';
import { ContextService } from './services/context.service';
import { EmailService } from './services/email.service';
import { AiService } from './services/ai.service';

@Module({
    providers: [SecurityService, TenantInterceptor, RolesGuard, ContextService, EmailService, AiService],
    exports: [SecurityService, TenantInterceptor, RolesGuard, ContextService, EmailService, AiService],
})
export class CommonModule { }

