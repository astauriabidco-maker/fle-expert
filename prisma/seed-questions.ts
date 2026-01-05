import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
    // --- GRAMMAIRE ---
    {
        level: 'B2',
        topic: 'Grammaire',
        content: '',
        questionText: 'Complétez la phrase : "Bien que tu _____ raison, je ne peux pas accepter ta proposition."',
        options: JSON.stringify(['aies', 'as', 'aurais', 'avais']),
        correctAnswer: 'aies',
        explanation: 'La locution conjonctive "bien que" est toujours suivie du subjonctif. Ici, "avoir" au subjonctif présent : "que tu aies".'
    },
    {
        level: 'B2',
        topic: 'Grammaire',
        content: '',
        questionText: 'Parmi les phrases suivantes, laquelle utilise correctement le pronom relatif "dont" ?',
        options: JSON.stringify([
            'C\'est le livre dont je t\'ai parlé.',
            'C\'est le livre dont j\'ai lu.',
            'C\'est l\'homme dont je connais.',
            'C\'est la ville dont je vais.'
        ]),
        correctAnswer: 'C\'est le livre dont je t\'ai parlé.',
        explanation: '"Dont" remplace un complément introduit par "de". On dit "parler de quelque chose", donc "le livre dont je t\'ai parlé".'
    },
    {
        level: 'B2',
        topic: 'Grammaire',
        content: '',
        questionText: 'Quel est le mode verbal utilisé après "Espérons que" ?',
        options: JSON.stringify(['Indicatif', 'Subjonctif', 'Conditionnel', 'Impératif']),
        correctAnswer: 'Indicatif',
        explanation: '"Espérer que" est suivi de l\'indicatif (généralement le futur simple), car on considère le fait comme probable.'
    },
    {
        level: 'B1',
        topic: 'Grammaire',
        content: '',
        questionText: 'Transformez à la voix passive : "Le chat mange la souris."',
        options: JSON.stringify([
            'La souris est mangée par le chat.',
            'La souris a mangé le chat.',
            'La souris est manger par le chat.',
            'La souris était mangé par le chat.'
        ]),
        correctAnswer: 'La souris est mangée par le chat.',
        explanation: 'Le sujet "La souris" subit l\'action. Le verbe est au présent, le participe passé "mangée" s\'accorde avec "la souris" (féminin singulier).'
    },
    {
        level: 'B2',
        topic: 'Grammaire',
        content: '',
        questionText: 'Choisissez la bonne forme : "Si j\'avais su, je _____ venu."',
        options: JSON.stringify(['serais', 'étais', 'fus', 'sois']),
        correctAnswer: 'serais',
        explanation: 'C\'est une hypothèse dans le passé (irréel du passé). La structure est : Si + Plus-que-parfait, Conditionnel Passé. "Je serais venu".'
    },

    // --- VOCABULAIRE ---
    {
        level: 'B2',
        topic: 'Vocabulaire',
        content: '',
        questionText: 'Quel est le synonyme de "éphémère" ?',
        options: JSON.stringify(['Passager', 'Éternel', 'Solide', 'Ancien']),
        correctAnswer: 'Passager',
        explanation: '"Éphémère" désigne quelque chose qui dure très peu de temps, tout comme "passager".'
    },
    {
        level: 'B2',
        topic: 'Vocabulaire',
        content: '',
        questionText: 'Que signifie l\'expression "Poser un lapin" ?',
        options: JSON.stringify([
            'Ne pas venir à un rendez-vous',
            'Cuisiner un lapin',
            'Faire un cadeau surprise',
            'Courir très vite'
        ]),
        correctAnswer: 'Ne pas venir à un rendez-vous',
        explanation: 'C\'est une expression familière qui signifie faire attendre quelqu\'un en ne se présentant pas à un rendez-vous prévu.'
    },
    {
        level: 'C1',
        topic: 'Vocabulaire',
        content: '',
        questionText: 'Lequel de ces mots est un antonyme de "altruiste" ?',
        options: JSON.stringify(['Égoïste', 'Généreux', 'Bénévole', 'Sympathique']),
        correctAnswer: 'Égoïste',
        explanation: 'Un altruiste se soucie des autres, tandis qu\'un égoïste ne pense qu\'à lui-même.'
    },

    // --- COMPRÉHENSION ÉCRITE ---
    {
        level: 'B2',
        topic: 'Compréhension Écrite',
        content: 'Article : Le télétravail est devenu une norme pour beaucoup d\'entreprises après la pandémie. Cependant, certaines études montrent qu\'il peut isoler les employés et réduire la créativité collective qui naît des échanges spontanés à la machine à café.',
        questionText: 'Selon le texte, quel est un inconvénient du télétravail ?',
        options: JSON.stringify([
            'Il réduit la créativité collective.',
            'Il coûte plus cher aux entreprises.',
            'Il empêche de boire du café.',
            'Il augmente le temps de trajet.'
        ]),
        correctAnswer: 'Il réduit la créativité collective.',
        explanation: 'Le texte mentionne explicitement que cela peut "réduire la créativité collective qui naît des échanges spontanés".'
    },
    {
        level: 'B1',
        topic: 'Compréhension Écrite',
        content: 'Annonce : À louer, grand appartement de 3 pièces en centre-ville. Proche commerces et transports. Loyer 850€ charges comprises. Libre de suite. Contacter M. Durant après 18h.',
        questionText: 'Quand peut-on appeler M. Durant ?',
        options: JSON.stringify(['Après 18h', 'Le matin', 'À midi', 'N\'importe quand']),
        correctAnswer: 'Après 18h',
        explanation: 'L\'annonce précise "Contacter M. Durant après 18h".'
    },

    // --- CONJUGAISON (Topic mapped to Grammaire usually, but let's vary) ---
    {
        level: 'A2',
        topic: 'Conjugaison',
        content: '',
        questionText: 'Conjuguez le verbe "aller" au futur simple (Tu) :',
        options: JSON.stringify(['iras', 'vas', 'alleras', 'irais']),
        correctAnswer: 'iras',
        explanation: 'Le futur simple du verbe aller est irrégulier : j\'irai, tu iras, il ira...'
    }
];

async function main() {
    console.log('Start seeding questions...');

    // Get the default organization (Admin)
    const org = await prisma.organization.findUnique({
        where: { slug: 'preptef-admin' }
    });

    if (!org) {
        console.error('Organization preptef-admin not found. Run standard seed first.');
        return;
    }

    for (const q of questions) {
        // Check duplication by text
        const exists = await prisma.question.findFirst({
            where: { questionText: q.questionText, organizationId: org.id }
        });

        if (!exists) {
            await prisma.question.create({
                data: {
                    ...q,
                    organizationId: org.id,
                    isActive: true
                }
            });
            console.log(`Created question: ${q.questionText.substring(0, 30)}...`);
        } else {
            console.log(`Skipped existing: ${q.questionText.substring(0, 30)}...`);
        }
    }

    console.log('Seeding questions finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
