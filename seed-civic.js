
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding civic content...');

    const m1 = await prisma.civicModule.create({
        data: {
            title: 'Les Valeurs de la République',
            topic: 'Liberté, Égalité, Fraternité',
            order: 1,
            lessons: {
                create: [
                    {
                        title: 'La Liberté',
                        content: 'La liberté est un droit fondamental. Elle inclut la liberté d\'expression, de conscience et de réunion. Cependant, elle est encadrée par la loi pour respecter celle d\'autrui.',
                        videoId: '123',
                        keyPoints: JSON.stringify(['Liberté d\'expression', 'Liberté de culte', 'Droit de réunion', 'Respect d\'autrui']),
                        order: 1
                    },
                    {
                        title: 'L\'Égalité',
                        content: 'Tous les citoyens sont égaux devant la loi. La parité homme-femme et la lutte contre les discriminations sont des priorités républicaines.',
                        videoId: '456',
                        keyPoints: JSON.stringify(['Égalité devant la loi', 'Candidature mixte', 'Égalité salariale', 'Accès aux soins']),
                        order: 2
                    },
                    {
                        title: 'La Fraternité',
                        content: 'C\'est le lien de solidarité qui unit les Français. Elle s\'exprime à travers l\'entraide, le bénévolat et les services de protection sociale.',
                        videoId: '789',
                        keyPoints: JSON.stringify(['Sécurité Sociale', 'Solidarité nationale', 'Engagement bénévole', 'Aide aux démunis']),
                        order: 3
                    }
                ]
            },
            questions: {
                create: [
                    { text: "Quel est l'emblème de la République française ?", options: JSON.stringify(["Le Coq", "Le drapeau tricolore", "La Tour Eiffel"]), correctAnswer: 1, explanation: "Le drapeau bleu, blanc, rouge est l'emblème national.", isOfficial: true, category: "Valeurs" },
                    { text: "Quelle est la devise de la République ?", options: JSON.stringify(["Paix, Travail, Patrie", "Liberté, Égalité, Fraternité", "Force, Honneur, Courage"]), correctAnswer: 1, explanation: "La devise Liberté, Égalité, Fraternité est inscrite dans la Constitution.", isOfficial: true, category: "Valeurs" },
                    { text: "Quel oiseau est souvent associé à la France ?", options: JSON.stringify(["L'Aigle", "Le Coq", "Le Phénix"]), correctAnswer: 1, explanation: "Le coq gaulois est un symbole non officiel mais très populaire.", isOfficial: false, category: "Valeurs" }
                ]
            }
        }
    });

    const m2 = await prisma.civicModule.create({
        data: {
            title: 'L\'Histoire de France',
            topic: 'Dates clés et personnages',
            order: 2,
            lessons: {
                create: [
                    { title: 'La Révolution Française', content: '1789 marque la fin de la monarchie absolue et la naissance de la Déclaration des Droits de l\'Homme et du Citoyen.', videoId: 'hist1', order: 1 },
                    { title: 'Les Guerres Mondiales', content: 'Comprendre l\'impact des conflits du XXème siècle sur la France moderne.', videoId: 'hist2', order: 2 },
                    { title: 'La Vème République', content: 'De Charles de Gaulle à nos jours, comment nos institutions ont été façonnées.', videoId: 'hist3', order: 3 }
                ]
            },
            questions: {
                create: [
                    { text: "En quelle année a eu lieu la Révolution française ?", options: JSON.stringify(["1715", "1789", "1804"]), correctAnswer: 1, explanation: "La Révolution commence en 1789.", isOfficial: true, category: "Histoire" },
                    { text: "Qui était Charles de Gaulle ?", options: JSON.stringify(["Un roi de France", "Un général et président de la République", "Un célèbre écrivain"]), correctAnswer: 1, explanation: "Charles de Gaulle a fondé la Vème République.", isOfficial: true, category: "Histoire" }
                ]
            }
        }
    });

    const m3 = await prisma.civicModule.create({
        data: {
            title: 'Les Institutions',
            topic: 'Élections, Gouvernement, Lois',
            order: 3,
            lessons: {
                create: [
                    { title: 'Le Président de la République', content: 'Chef de l\'État, élu au suffrage universel direct pour 5 ans.', videoId: 'inst1', order: 1 },
                    { title: 'Le Gouvernement & Le Parlement', content: 'Le Premier Ministre conduit la politique de la nation.', videoId: 'inst2', order: 2 }
                ]
            },
            questions: {
                create: [
                    { text: "Quelle est la durée du mandat du Président ?", options: JSON.stringify(["4 ans", "5 ans", "7 ans"]), correctAnswer: 1, explanation: "C'est un quinquennat.", isOfficial: true, category: "Institutions" },
                    { text: "Qui vote les lois en France ?", options: JSON.stringify(["Le Gouvernement", "Le Parlement", "Le Conseil d'État"]), correctAnswer: 1, explanation: "Le Parlement vote la loi.", isOfficial: true, category: "Institutions" }
                ]
            }
        }
    });

    const m4 = await prisma.civicModule.create({
        data: {
            title: 'Droits et Devoirs',
            topic: 'Laïcité, Solidarité, Civisme',
            order: 4,
            lessons: {
                create: [
                    { title: 'La Laïcité', content: 'La neutralité de l\'État vis-à-vis des religions.', videoId: 'dd1', order: 1 },
                    { title: 'Devoirs du Citoyen', content: 'Payer ses impôts, participer aux jurys d\'assises.', videoId: 'dd2', order: 2 }
                ]
            },
            questions: {
                create: [
                    { text: "Qu'est-ce que la laïcité ?", options: JSON.stringify(["Obligation religieuse", "Neutralité de l'État", "Interdiction religieuse"]), correctAnswer: 1, explanation: "Libre exercice du culte et neutralité de l'État.", isOfficial: true, category: "Droits" },
                    { text: "L'impôt est-il obligatoire ?", options: JSON.stringify(["Oui", "Non", "Seulement entreprises"]), correctAnswer: 0, explanation: "C'est un devoir civique.", isOfficial: true, category: "Droits" }
                ]
            }
        }
    });

    // Additional official questions for the simulator
    await prisma.civicQuestion.createMany({
        data: [
            { text: "Quelle est la date de la Fête Nationale ?", options: JSON.stringify(["1er Mai", "14 Juillet", "11 Novembre"]), correctAnswer: 1, explanation: "Le 14 juillet commémore la Fête de la Fédération.", isOfficial: true, category: "Histoire" },
            { text: "L'hymne national de la France est :", options: JSON.stringify(["La Marseillaise", "Le Chant des Partisans", "L'Ode à la Joie"]), correctAnswer: 0, explanation: "Composée par Rouget de Lisle.", isOfficial: true, category: "Nation" },
            { text: "Quel est l'âge de la majorité en France ?", options: JSON.stringify(["16 ans", "18 ans", "21 ans"]), correctAnswer: 1, explanation: "Fixé à 18 ans depuis 1974.", isOfficial: true, category: "Droits" }
        ]
    });

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
