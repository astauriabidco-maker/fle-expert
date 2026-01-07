import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { ContentLabModule } from './content-lab/content-lab.module';
import { CertificateModule } from './certificate/certificate.module';
import { ExamModule } from './exam/exam.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { RolesGuard } from './common/guards/roles.guard';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { InvitationsModule } from './invitations/invitations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LearningModule } from './learning/learning.module';
import { ProofsModule } from './proofs/proofs.module';
import { CreditsModule } from './credits/credits.module';
import { SalesModule } from './sales/sales.module';
import { CoachModule } from './coach/coach.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { LeadsModule } from './leads/leads.module';
import { MessagingModule } from './messaging/messaging.module';
import { GamificationModule } from './gamification/gamification.module';
import { AIModule } from './ai/ai.module';
import { CivicModule } from './civic/civic.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ClassroomModule } from './classroom/classroom.module';


@Module({
  imports: [
    CommonModule,
    PrismaModule,
    ContentLabModule,
    CertificateModule,
    ExamModule,
    PaymentsModule,
    AdminModule,
    AuthModule,
    InvitationsModule,
    AnalyticsModule,
    LearningModule,
    CreditsModule,
    ProofsModule,
    SalesModule,
    CoachModule,
    OnboardingModule,
    LeadsModule,
    MessagingModule,
    GamificationModule,
    AIModule,
    CivicModule,
    NotificationsModule,
    ClassroomModule

  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule { }
