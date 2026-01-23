import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

interface OrgAISettings {
    provider: 'platform' | 'openai' | 'gemini' | 'custom';
    openaiKey?: string;
    geminiKey?: string;
    transcriptionProvider?: 'openai' | 'platform';
    generationProvider?: 'openai' | 'gemini' | 'platform';
}

@Injectable()
export class AIService {
    private platformOpenai: OpenAI | null = null;
    private orgClientCache: Map<string, OpenAI> = new Map();
    private orgSettingsCache: Map<string, { settings: OrgAISettings; expiresAt: number }> = new Map();

    constructor(private prisma: PrismaService) {
        // Initialize platform OpenAI if key is available
        if (process.env.OPENAI_API_KEY) {
            this.platformOpenai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            console.log('[AIService] Platform OpenAI initialized');
        } else {
            console.warn('[AIService] OPENAI_API_KEY not found - transcription will use mock data');
        }
    }

    /**
     * Get org AI settings with caching (5 min TTL)
     */
    private async getOrgAISettings(orgId: string): Promise<OrgAISettings | null> {
        const cached = this.orgSettingsCache.get(orgId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.settings;
        }

        try {
            const org = await this.prisma.organization.findUnique({
                where: { id: orgId },
                select: { aiSettings: true }
            });

            if (!org?.aiSettings) return null;

            const settings = JSON.parse(org.aiSettings) as OrgAISettings;
            this.orgSettingsCache.set(orgId, {
                settings,
                expiresAt: Date.now() + 5 * 60 * 1000 // 5 min cache
            });

            return settings;
        } catch (error) {
            console.error(`[AIService] Failed to get AI settings for org ${orgId}:`, error);
            return null;
        }
    }

    /**
     * Get OpenAI client for an organization (uses org key if configured, else platform key)
     */
    private async getOpenAIClient(orgId?: string): Promise<OpenAI | null> {
        if (!orgId) return this.platformOpenai;

        // Check cache first
        const cached = this.orgClientCache.get(orgId);
        if (cached) return cached;

        // Get org settings
        const settings = await this.getOrgAISettings(orgId);

        // Use org key if provider is openai or custom with openai transcription
        if (settings?.openaiKey &&
            (settings.provider === 'openai' ||
                settings.provider === 'custom' && settings.transcriptionProvider === 'openai')) {
            const client = new OpenAI({ apiKey: settings.openaiKey });
            this.orgClientCache.set(orgId, client);
            console.log(`[AIService] Using org-specific OpenAI key for org ${orgId}`);
            return client;
        }

        // Fallback to platform key
        return this.platformOpenai;
    }

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

    async transcribeAudio(audioPath: string, orgId?: string): Promise<string> {
        console.log(`[AIService] Transcribing audio file: ${audioPath}${orgId ? ` for org ${orgId}` : ''}`);

        // Get the appropriate OpenAI client (org-specific or platform)
        const openai = await this.getOpenAIClient(orgId);

        // Fallback to mock if no OpenAI client available
        if (!openai) {
            console.warn('[AIService] Using mock transcription - no OpenAI key configured');
            return "Ceci est une transcription simulée de la réponse du candidat. Le candidat parle de ses dernières vacances et utilise le passé composé et l'imparfait.";
        }

        try {
            // Resolve the audio path (handle relative paths from uploads folder)
            const resolvedPath = audioPath.startsWith('/')
                ? audioPath
                : path.join(process.cwd(), audioPath);

            // Check if file exists
            if (!fs.existsSync(resolvedPath)) {
                console.error(`[AIService] Audio file not found: ${resolvedPath}`);
                throw new Error(`Audio file not found: ${resolvedPath}`);
            }

            // Create file stream for Whisper API
            const file = fs.createReadStream(resolvedPath);

            // Call OpenAI Whisper API
            const response = await openai.audio.transcriptions.create({
                file: file,
                model: 'whisper-1',
                language: 'fr', // French transcription
                response_format: 'text'
            });

            console.log(`[AIService] Transcription completed: ${response.substring(0, 100)}...`);
            return response;

        } catch (error) {
            console.error('[AIService] Whisper transcription failed:', error);
            // Fallback to mock on error
            return "Transcription échouée - réponse simulée pour évaluation.";
        }
    }

    async evaluateOralResponse(
        transcription: string,
        prompt: string,
        level: string,
        orgId?: string
    ): Promise<{
        score: number;
        feedback: string;
        details: {
            coherence: number;
            grammar: number;
            vocabulary: number;
        };
    }> {
        const openai = await this.getOpenAIClient(orgId);

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

        // Use OpenAI if available
        if (openai) {
            try {
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Transcription de la réponse du candidat:\n\n${transcription}` }
                    ],
                    temperature: 0.3,
                    response_format: { type: 'json_object' }
                });

                const content = response.choices[0]?.message?.content;
                if (content) {
                    const parsed = JSON.parse(content);
                    console.log(`[AIService] Oral evaluation completed for org ${orgId || 'platform'}`);
                    return {
                        score: parsed.score ?? 75,
                        feedback: parsed.feedback ?? "Évaluation automatique.",
                        details: {
                            coherence: parsed.details?.coherence ?? 75,
                            grammar: parsed.details?.grammar ?? 75,
                            vocabulary: parsed.details?.vocabulary ?? 75
                        }
                    };
                }
            } catch (error) {
                console.error('[AIService] Oral evaluation failed:', error);
            }
        }

        // Mock response fallback
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

    /**
     * Generate personalized LLM feedback for each sub-competency (CO, EO, CE, EE)
     */
    async generateSkillFeedback(
        skills: Record<string, { percent: number; correct: number; total: number; level?: string }>,
        globalLevel: string,
        orgId?: string
    ): Promise<{
        skillAdvice: Record<string, {
            feedback: string;
            priority: 'high' | 'medium' | 'low';
            exercises: string[];
            improvement: string;
        }>;
        globalSummary: string;
    }> {
        const openai = await this.getOpenAIClient(orgId);

        // Build skill summary for prompt
        const skillDescriptions = Object.entries(skills).map(([key, value]) => {
            const skillName = this.getSkillFullName(key);
            return `- ${skillName}: ${value.percent}% (${value.correct}/${value.total} corrects)`;
        }).join('\n');

        const systemPrompt = `Tu es un expert en pédagogie du FLE (Français Langue Étrangère) et en préparation aux examens TEF/TCF.
Tu analyses les résultats d'un apprenant de niveau ${globalLevel} et fournis des conseils personnalisés.

Voici les résultats par compétence :
${skillDescriptions}

Pour CHAQUE compétence (CO, EO, CE, EE), génère :
1. Un feedback personnalisé (2-3 phrases) basé sur le pourcentage de réussite
2. Un niveau de priorité : "high" si <50%, "medium" si 50-70%, "low" si >70%
3. 2-3 exercices concrets recommandés
4. Un objectif d'amélioration réaliste

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "skillAdvice": {
    "CO": { "feedback": "...", "priority": "high|medium|low", "exercises": ["..."], "improvement": "..." },
    "EO": { "feedback": "...", "priority": "high|medium|low", "exercises": ["..."], "improvement": "..." },
    "CE": { "feedback": "...", "priority": "high|medium|low", "exercises": ["..."], "improvement": "..." },
    "EE": { "feedback": "...", "priority": "high|medium|low", "exercises": ["..."], "improvement": "..." }
  },
  "globalSummary": "Synthèse globale et plan d'action prioritaire (2-3 phrases)"
}`;

        if (openai) {
            try {
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Génère les conseils personnalisés pour cet apprenant de niveau ${globalLevel}.` }
                    ],
                    temperature: 0.7,
                    response_format: { type: 'json_object' }
                });

                const content = response.choices[0]?.message?.content;
                if (content) {
                    const parsed = JSON.parse(content);
                    console.log(`[AIService] Skill feedback generated for org ${orgId || 'platform'}`);
                    return {
                        skillAdvice: parsed.skillAdvice || this.getMockSkillAdvice(skills),
                        globalSummary: parsed.globalSummary || "Continuez vos efforts réguliers pour progresser."
                    };
                }
            } catch (error) {
                console.error('[AIService] Skill feedback generation failed:', error);
            }
        }

        // Mock fallback
        return {
            skillAdvice: this.getMockSkillAdvice(skills),
            globalSummary: `Avec un niveau ${globalLevel}, vous avez une base solide. Concentrez-vous sur vos points faibles pour atteindre le niveau supérieur.`
        };
    }

    private getSkillFullName(key: string): string {
        const names: Record<string, string> = {
            'CO': 'Compréhension Orale',
            'EO': 'Expression Orale',
            'CE': 'Compréhension Écrite',
            'EE': 'Expression Écrite'
        };
        return names[key] || key;
    }

    private getMockSkillAdvice(skills: Record<string, any>): Record<string, any> {
        const advice: Record<string, any> = {};

        for (const [key, value] of Object.entries(skills)) {
            const percent = value.percent || 0;
            const priority = percent < 50 ? 'high' : percent < 70 ? 'medium' : 'low';

            advice[key] = {
                feedback: percent < 50
                    ? `Cette compétence nécessite un travail approfondi. ${this.getSkillFullName(key)} est votre priorité.`
                    : percent < 70
                        ? `Bon niveau en ${this.getSkillFullName(key)}, mais quelques ajustements amélioreront vos résultats.`
                        : `Excellente maîtrise de la ${this.getSkillFullName(key)}. Continuez à pratiquer pour maintenir ce niveau.`,
                priority,
                exercises: this.getDefaultExercises(key),
                improvement: percent < 70 ? `+${Math.round((70 - percent) / 2)}% en 4 semaines` : "Maintien du niveau"
            };
        }

        return advice;
    }

    private getDefaultExercises(skill: string): string[] {
        const exercises: Record<string, string[]> = {
            'CO': ['Écouter des podcasts en français', 'Regarder des films avec sous-titres', 'Pratiquer avec des exercices de dictée'],
            'EO': ['Enregistrer des monologues quotidiens', 'Participer à des conversations', 'Lire à voix haute'],
            'CE': ['Lire des articles de presse', 'Résumer des textes', 'Analyser des documents administratifs'],
            'EE': ['Rédiger des emails formels', 'Tenir un journal en français', 'Pratiquer les lettres de motivation']
        };
        return exercises[skill] || ['Pratiquer régulièrement', 'Réviser le vocabulaire de base'];
    }
}
