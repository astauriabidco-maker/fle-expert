import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../common/services/security.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private security: SecurityService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = pass.trim();

        const user = await this.prisma.user.findUnique({
            where: { email: cleanEmail },
            include: { organization: true, coach: true },
        });

        if (user && user.password) {
            // Password stored as salt:hash
            const [salt, hash] = user.password.split(':');
            const { hash: computedHash } = this.security.hashWithSalt(cleanPass, salt);

            console.log(`[DEBUG] Login attempt for ${cleanEmail}`);
            console.log(`[DEBUG] Input Pass: '${cleanPass}'`);
            console.log(`[DEBUG] Stored Salt: ${salt}`);
            console.log(`[DEBUG] Stored Hash: ${hash}`);
            console.log(`[DEBUG] Comput Hash: ${computedHash}`);
            console.log(`[DEBUG] Match? ${computedHash === hash}`);

            if (computedHash === hash) {
                const { password, ...result } = user;
                return result;
            }
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            organizationId: user.organization?.id || null
        };

        console.log("[DEBUG] AuthService.login - payload:", JSON.stringify(payload));
        const token = this.jwtService.sign(payload);
        console.log("[DEBUG] AuthService.login - token generated");

        const response = {
            access_token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                currentLevel: user.currentLevel,
                targetLevel: user.targetLevel,
                objective: user.objective,
                phone: user.phone,
                address: user.address,
                city: user.city,
                postalCode: user.postalCode,
                hasCompletedDiagnostic: user.hasCompletedDiagnostic,
                hasVerifiedPrerequisites: user.hasVerifiedPrerequisites,
                coach: user.coach ? {
                    id: user.coach.id,
                    name: user.coach.name,
                    email: user.coach.email
                } : null
            },
            organization: user.organization ? {
                id: user.organization.id,
                name: user.organization.name,
                availableCredits: user.organization.creditsBalance ?? 0,
                logoUrl: user.organization.logoUrl
            } : null
        };
        console.log("[DEBUG] AuthService.login - response prepared");
        return response;
    }

    async register(registrationData: any, token: string) {
        // 1. Verify token
        const invitation = await this.prisma.invitation.findUnique({
            where: { token },
            include: { organization: true },
        });

        if (!invitation || new Date() > invitation.expiresAt) {
            throw new BadRequestException("Invitation invalide ou expirée");
        }

        // 2. Hash password
        const { hash, salt } = this.security.hashWithSalt(registrationData.password);
        const passwordStored = `${salt}:${hash}`;

        // 3. Determine Goal & Level
        const objective = registrationData.objective || 'PROFESSIONAL';
        const targetLevel = this.determineTargetLevel(objective);

        // 4. Create user schema
        const user = await this.prisma.user.create({
            data: {
                email: invitation.email,
                name: registrationData.name,
                password: passwordStored,
                role: 'CANDIDATE',
                organizationId: invitation.organizationId,
                objective: objective,
                targetLevel: targetLevel
            } as any,
            include: { organization: true },
        });

        // 5. Delete invitation (consume token)
        await this.prisma.invitation.delete({ where: { token } });

        // 6. Return login payload
        return this.login(user);
    }

    async registerPartner(data: any) {
        // 1. Check if email exists
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) throw new BadRequestException('Email déjà utilisé');

        // 2. Hash password
        const { hash, salt } = this.security.hashWithSalt(data.password);
        const passwordStored = `${salt}:${hash}`;

        // 3. Create Org + User Transaction
        const user = await this.prisma.$transaction(async (tx) => {
            // Create Organization with auto-generated slug
            const slug = data.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

            const org = await tx.organization.create({
                data: {
                    name: data.schoolName,
                    slug: slug,
                    status: 'ACTIVE',
                    creditsBalance: 50, // Welcome bonus
                }
            });

            // Create Admin User
            return await tx.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    password: passwordStored,
                    role: 'ORG_ADMIN',
                    organizationId: org.id,
                },
                include: { organization: true }
            });
        });

        // 4. Return login payload
        return this.login(user);
    }

    private determineTargetLevel(objective: string): string {
        switch (objective) {
            case 'RESIDENCY_MULTI_YEAR': return 'A2';
            case 'RESIDENCY_10_YEAR': return 'B1';
            case 'NATURALIZATION': return 'B2';
            case 'CANADA_IMMIGRATION': return 'B2'; // Default high
            default: return 'B2';
        }
    }
}
