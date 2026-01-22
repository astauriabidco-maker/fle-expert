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

    async transcribeAudio(audioPath: string): Promise<string> {
        // In a real implementation, this would call OpenAI Whisper or Google Speech-to-Text
        // For now, we return a mock transcription
        console.log(`Transcribing audio file at: ${audioPath}`);
        return "Ceci est une transcription simulée de la réponse du candidat. Le candidat parle de ses dernières vacances et utilise le passé composé et l'imparfait.";
    }

    async evaluateOralResponse(
        transcription: string,
        prompt: string,
        level: string
    ): Promise<{
        score: number;
        feedback: string;
        details: {
            coherence: number;
            grammar: number;
            vocabulary: number;
        };
    }> {
        const systemPrompt = `Tu es un examinateur expert du CECRL pour le français.
        Ton rôle est d'évaluer une transcription de réponse orale.
        
        Niveau cible: ${level}
        Consigne donnée au candidat: ${prompt}
        
        Analyse la réponse suivante et fournis une évaluation JSON structurée :
        {
          "score": (note sur 100),
          "feedback": (commentaire constructif en français),
          "details": {
            "coherence": (note sur 100),
            "grammar": (note sur 100),
            "vocabulary": (note sur 100)
          }
        }
        `;

        // Mock response for now as we don't have the OpenAI service injected immediately available
        // logic would go here

        return {
            score: 75,
            feedback: "Bonne utilisation des temps du passé. Attention à la prononciation et à quelques accords.",
            details: {
                coherence: 80,
                grammar: 70,
                vocabulary: 75,
            },
        };
    }
}
