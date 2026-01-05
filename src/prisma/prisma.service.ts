import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ContextService } from '../common/services/context.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor(private readonly contextService: ContextService) {
        super();
    }

    async onModuleInit() {
        await this.$connect();
    }

    get extended() {
        const contextService = this.contextService;
        return this.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }: any) {
                        const organizationId = contextService.get('organizationId') as string | undefined;

                        if (organizationId) {
                            if (
                                operation === 'findUnique' ||
                                operation === 'findFirst' ||
                                operation === 'findMany' ||
                                operation === 'count' ||
                                operation === 'update' ||
                                operation === 'updateMany' ||
                                operation === 'delete' ||
                                operation === 'deleteMany'
                            ) {
                                // Cast args to any to avoid TS union issues
                                const anyArgs = (args || {}) as any;
                                anyArgs.where = anyArgs.where || {};

                                // Models that belong to an organization
                                if (['User', 'ExamSession', 'CreditTransaction', 'Question', 'TrainingProposal', 'Contract', 'OfflineProof'].includes(model)) {
                                    anyArgs.where.organizationId = organizationId;
                                }

                                // For Organization model, restrict to the current organization
                                if (model === 'Organization') {
                                    anyArgs.where.id = organizationId;
                                }

                                // Reassign back to args if needed, but query(args) uses the object reference usually.
                                // However, args might be undefined initially, so we need to pass the modified object.
                                args = anyArgs;
                            }

                            if (operation === 'create' || (operation as string) === 'createMany') {
                                if (['User', 'ExamSession', 'CreditTransaction', 'Question', 'TrainingProposal', 'Contract', 'OfflineProof'].includes(model)) {
                                    if (operation === 'create') {
                                        const anyArgs = (args || {}) as any;
                                        anyArgs.data = anyArgs.data || {};
                                        anyArgs.data.organizationId = organizationId;
                                        args = anyArgs;
                                    }
                                    // createMany logic...
                                }
                            }
                        }

                        return query(args);
                    },
                },
            },
        });
    }
}
