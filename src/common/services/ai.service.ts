import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface QuestionGenerated {
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private openai: OpenAI | null = null;
    private gemini: GoogleGenerativeAI | null = null;

    constructor() {
        // Initialize OpenAI if key is available
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            this.logger.log('OpenAI initialized');
        }

        // Initialize Gemini if key is available
        if (process.env.GEMINI_API_KEY) {
            this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.logger.log('Gemini initialized');
        }

        if (!this.openai && !this.gemini) {
            this.logger.warn('No AI API key configured. AI features will use mock data.');
        }
    }

    async generateQuestions(
        topic: string,
        level: string,
        count: number = 5,
        preferredProvider?: 'openai' | 'gemini'
    ): Promise<QuestionGenerated[]> {
        const prompt = this.buildPrompt(topic, level, count);

        // Try preferred provider first
        if (preferredProvider === 'gemini' && this.gemini) {
            return this.generateWithGemini(prompt, count);
        }
        if (preferredProvider === 'openai' && this.openai) {
            return this.generateWithOpenAI(prompt, count);
        }

        // Fallback to any available provider
        if (this.openai) {
            return this.generateWithOpenAI(prompt, count);
        }
        if (this.gemini) {
            return this.generateWithGemini(prompt, count);
        }

        // Mock data if no provider available
        this.logger.warn('Using mock questions - no AI provider configured');
        return this.generateMockQuestions(topic, level, count);
    }

    private buildPrompt(topic: string, level: string, count: number): string {
        const levelGuidelines = this.getLevelGuidelines(level);

        return `Tu es un expert en français langue étrangère (FLE) spécialisé dans la préparation aux examens TEF et TCF.
Génère exactement ${count} questions à choix multiples (QCM) pour des apprenants de niveau ${level} (CECRL).

Sujet: ${topic}

## DIRECTIVES STRICTES POUR LE NIVEAU ${level}

${levelGuidelines}

## FORMAT DE RÉPONSE

Pour chaque question, fournis:
- questionText: L'énoncé de la question (adapté au niveau ${level})
- options: Un tableau de 4 options de réponse (les distracteurs doivent être plausibles pour ce niveau)
- correctAnswer: La bonne réponse (doit être exactement une des options)
- explanation: Une explication pédagogique claire adaptée au niveau ${level}

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après.
Exemple de format:
[
  {
    "questionText": "Quel est le passé composé de 'aller' ?",
    "options": ["J'ai allé", "Je suis allé", "J'allais", "Je vas"],
    "correctAnswer": "Je suis allé",
    "explanation": "Le verbe 'aller' se conjugue avec l'auxiliaire 'être' au passé composé."
  }
]`;
    }

    private getLevelGuidelines(level: string): string {
        const guidelines: Record<string, string> = {
            'A1': `### Niveau A1 - Découverte
- Vocabulaire: mots très courants (famille, couleurs, nombres, objets quotidiens)
- Grammaire: présent de l'indicatif, articles, adjectifs de base
- Phrases: courtes et simples (sujet + verbe + complément)
- Contexte: situations immédiates et concrètes
- Questions: identification, choix simple, association directe
- Éviter: temps composés, subjonctif, phrases complexes`,

            'A2': `### Niveau A2 - Survie
- Vocabulaire: vie quotidienne élargie (achats, transports, loisirs)
- Grammaire: passé composé, imparfait simple, futurs proches
- Phrases: 2 propositions maximum, connecteurs simples (et, mais, parce que)
- Contexte: situations sociales courantes
- Questions: compléter, transformer, courte compréhension
- Éviter: textes longs, expressions idiomatiques complexes`,

            'B1': `### Niveau B1 - Seuil
- Vocabulaire: thèmes variés (travail, actualité, voyages)
- Grammaire: tous les temps de l'indicatif, conditionnel présent, subjonctif courant
- Phrases: complexité moyenne, propositions subordonnées
- Contexte: opinions, expériences, projets
- Questions: argumentation simple, inférence basique
- Peut inclure: expressions courantes, registres standard`,

            'B2': `### Niveau B2 - Indépendant
- Vocabulaire: nuancé, expressions idiomatiques, registres variés
- Grammaire: maîtrise de tous les modes et temps, concordance des temps
- Phrases: structures complexes, discours rapporté
- Contexte: débats, articles de presse, textes professionnels
- Questions: analyse, synthèse, nuances de sens
- Inclure: humour, ironie, implicite`,

            'C1': `### Niveau C1 - Autonome
- Vocabulaire: précis, technique, littéraire
- Grammaire: subtilités stylistiques, exceptions
- Phrases: très complexes, registres soutenus
- Contexte: académique, professionnel spécialisé
- Questions: interprétation fine, reformulation élaborée
- Inclure: références culturelles, jeux de mots`,

            'C2': `### Niveau C2 - Maîtrise
- Vocabulaire: exhaustif, archaïsmes, néologismes
- Grammaire: parfaite, incluant formes rares
- Phrases: toute complexité, style littéraire
- Contexte: littérature, philosophie, spécialisation avancée  
- Questions: critique, création, subtilité maximale
- Inclure: double sens, références culturelles profondes`
        };

        return guidelines[level] || guidelines['B1'];
    }

    private async generateWithOpenAI(prompt: string, count: number): Promise<QuestionGenerated[]> {
        try {
            const response = await this.openai!.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0]?.message?.content;
            if (!content) throw new Error('Empty response from OpenAI');

            const parsed = JSON.parse(content);
            // Handle both array response and object with questions key
            const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];

            return questions.slice(0, count);
        } catch (error) {
            this.logger.error('OpenAI generation failed:', error);
            throw error;
        }
    }

    private async generateWithGemini(prompt: string, count: number): Promise<QuestionGenerated[]> {
        try {
            const model = this.gemini!.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Extract JSON from response (may have markdown code blocks)
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('No JSON array found in Gemini response');

            const questions = JSON.parse(jsonMatch[0]);
            return questions.slice(0, count);
        } catch (error) {
            this.logger.error('Gemini generation failed:', error);
            throw error;
        }
    }

    private generateMockQuestions(topic: string, level: string, count: number): QuestionGenerated[] {
        const mockQuestions: QuestionGenerated[] = [];

        for (let i = 0; i < count; i++) {
            mockQuestions.push({
                questionText: `Question ${i + 1} sur ${topic} (niveau ${level})`,
                options: [
                    `Option A pour question ${i + 1}`,
                    `Option B pour question ${i + 1}`,
                    `Option C pour question ${i + 1}`,
                    `Option D pour question ${i + 1}`
                ],
                correctAnswer: `Option A pour question ${i + 1}`,
                explanation: `Explication de la réponse correcte pour la question ${i + 1}.`
            });
        }

        return mockQuestions;
    }
}
