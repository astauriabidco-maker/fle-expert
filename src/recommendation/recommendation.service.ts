
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationService {
    constructor(private readonly prisma: PrismaService) { }

    // Score Weights
    private readonly WEIGHTS = {
        PEDAGOGY: 0.4,
        LOCATION: 0.3,
        AVAILABILITY: 0.3
    };

    /**
     * Get top 3 recommended schools for a candidate based on their diagnostic result.
     */
    async getRecommendations(userId: string) {
        // 1. Fetch Candidate Profile & Latest Diagnostic
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { examSessions: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });

        if (!user) throw new NotFoundException('User not found');

        const diagnostic = user.examSessions[0];
        // Target level logic: if diagnostic says A2, target is B1. Manual override possible in user profile.
        const derivedLevel = diagnostic?.estimatedLevel || 'A1';
        const targetLevel = this.getNextLevel(derivedLevel);

        // 2. Fetch Candidates Schools (filtering basic hard criteria)
        const schools = await this.prisma.organization.findMany({
            where: {
                status: 'ACTIVE',
                levels: { has: targetLevel } // Must teach the target level
            }
        });

        // 3. Scoring Algorithm
        const scoredSchools = schools.map(school => {
            const score = this.calculateScore(school, user, targetLevel);
            return { ...school, matchScore: score };
        });

        // 4. Sort & Limit
        // Sort by Score DESC. If Premium, boost is already in score? Or apply secondary sort?
        // Let's rely on the score which includes the premium bonus.
        scoredSchools.sort((a, b) => b.matchScore - a.matchScore);

        return scoredSchools.slice(0, 3);
    }

    /**
     * Connect a lead to an organization
     */
    async connectLead(userId: string, organizationId: string) {
        // Check if lead already exists
        const existing = await this.prisma.lead.findFirst({
            where: { candidateId: userId, organizationId }
        });

        if (existing) return existing;

        // Fetch details to calculate score
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { examSessions: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        if (!user) throw new NotFoundException('User not found');

        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId }
        });
        if (!organization) throw new NotFoundException('Organization not found');

        // Calculate Score
        const diagnostic = user.examSessions[0];
        const derivedLevel = diagnostic?.estimatedLevel || 'A1';
        const targetLevel = this.getNextLevel(derivedLevel);

        const score = this.calculateScore(organization, user, targetLevel);

        return this.prisma.lead.create({
            data: {
                candidateId: userId,
                organizationId,
                status: 'PENDING',
                matchingScore: score
            }
        });
    }

    // --- Helpers ---

    private getNextLevel(current: string): string {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const idx = levels.indexOf(current);
        return idx < levels.length - 1 ? levels[idx + 1] : 'C2'; // Cap at C2
    }

    private calculateScore(school: any, user: any, targetLevel: string): number {
        let score = 0;

        // 1. Pedagogy (40 pts)
        // Hard match on level is guaranteed by query. 
        // Bonus for specialization?
        if (school.specialties && school.specialties.includes('FLE')) {
            score += 40;
        } else {
            score += 30; // Base score for having the level
        }

        // 2. Location (30 pts)
        // Simplified: if school city matches user city (if user has one), or generic remote handling
        // TO DO: Real Geo-dist calc
        if (user.city && school.city && user.city.toLowerCase() === school.city.toLowerCase()) {
            score += 30;
        } else {
            // Assume 10 pts for "online possible" or general proximity
            score += 10;
        }

        // 3. Availability (30 pts)
        // Check nextSessionStart
        if (school.nextSessionStart) {
            const diffDays = (new Date(school.nextSessionStart).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            if (diffDays > 0 && diffDays < 15) score += 30; // Starts soon
            else if (diffDays >= 15 && diffDays < 45) score += 20; // Medium term
            else score += 10; // Long term or past
        } else {
            score += 5; // Unknown
        }

        // 4. Premium Bonus (+20%)
        if (school.isPremium) {
            score = score * 1.2;
        }

        return Math.min(Math.round(score), 100);
    }
}
