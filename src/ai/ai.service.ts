import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AIService {
    constructor(private prisma: PrismaService) { }

    async getDiagnostic(userId: string) {
        const stats = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                examSessions: {
                    where: { status: 'COMPLETED' },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!stats || stats.examSessions.length === 0) {
            return {
                status: 'NEEDS_INITIAL_EXAM',
                message: "Passe ton premier examen blanc pour obtenir un diagnostic complet.",
                suggestions: []
            };
        }

        // Simulating AI analysis based on stats
        // In a real app, this would use an LLM or complex rule engine
        const priorities = [];
        if (stats.xp < 1000) priorities.push({ topic: 'Vocabulaire de base', reason: 'Niveau initial' });

        const latest = stats.examSessions[0];

        // Mocking logic for subjects
        const subjects = [
            { id: 'CO', name: 'Compréhension Orale', score: Math.random() * 100 },
            { id: 'CE', name: 'Compréhension Écrite', score: Math.random() * 100 },
            { id: 'EO', name: 'Expression Orale', score: Math.random() * 100 },
            { id: 'EE', name: 'Expression Écrite', score: Math.random() * 100 },
        ];

        const weakest = [...subjects].sort((a, b) => a.score - b.score)[0];

        return {
            status: 'READY',
            level: latest.estimatedLevel,
            analysis: `Ton niveau actuel est ${latest.estimatedLevel}. Ta plus grande marge de progression se situe en ${weakest.name}.`,
            weakestSubject: weakest,
            suggestions: [
                {
                    id: 1,
                    title: `Maîtriser ${weakest.name}`,
                    description: `D'après tes résultats, ce module t'aidera à gagner environ 150 points d'XP rapidement.`,
                    type: 'PRACTICE',
                    topic: weakest.id,
                    difficulty: 'ADAPTIVE'
                },
                {
                    id: 2,
                    title: "Série de vocabulaire 'Mon Quotidien'",
                    description: "Renforce tes bases pour passer au niveau supérieur.",
                    type: 'QUIZ',
                    topic: 'VOCABULARY',
                    difficulty: 'EASY'
                }
            ]
        };
    }
}
