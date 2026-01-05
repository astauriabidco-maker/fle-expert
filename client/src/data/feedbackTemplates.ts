// Feedback templates for coaches
export const FEEDBACK_TEMPLATES = [
    {
        id: 'encouragement',
        category: 'Encouragement',
        title: 'Excellent progrès',
        text: 'Félicitations pour vos progrès remarquables ! Continuez sur cette lancée, vous êtes sur la bonne voie pour atteindre votre objectif.',
        icon: '🌟'
    },
    {
        id: 'co_improve',
        category: 'Compréhension Orale',
        title: 'Améliorer la CO',
        text: 'Je vous recommande d\'écouter davantage de podcasts français (RFI, France Inter). Commencez par 15 minutes par jour et augmentez progressivement.',
        icon: '👂'
    },
    {
        id: 'ce_improve',
        category: 'Compréhension Écrite',
        title: 'Améliorer la CE',
        text: 'Pour progresser en compréhension écrite, lisez quotidiennement des articles du Monde ou du Figaro. Notez le vocabulaire nouveau.',
        icon: '📖'
    },
    {
        id: 'eo_improve',
        category: 'Expression Orale',
        title: 'Améliorer l\'EO',
        text: 'Pratiquez l\'expression orale en vous enregistrant. Répétez les exercices de phonétique et travaillez sur la fluidité de votre discours.',
        icon: '🎤'
    },
    {
        id: 'ee_improve',
        category: 'Expression Écrite',
        title: 'Améliorer l\'EE',
        text: 'Écrivez chaque jour un court texte (5-10 lignes). Variez les types de production : email, lettre formelle, argumentation.',
        icon: '✍️'
    },
    {
        id: 'vocabulary',
        category: 'Vocabulaire',
        title: 'Enrichir le vocabulaire',
        text: 'Créez des fiches de vocabulaire thématiques. Apprenez 10 nouveaux mots par jour avec leur contexte d\'utilisation.',
        icon: '📝'
    },
    {
        id: 'grammar_focus',
        category: 'Grammaire',
        title: 'Point grammaire',
        text: 'Revoyez les règles de conjugaison et d\'accord. Les exercices Bescherelle sont particulièrement utiles à ce niveau.',
        icon: '📚'
    },
    {
        id: 'exam_prep',
        category: 'Préparation Examen',
        title: 'Conseils examen',
        text: 'Pour l\'examen, gérez bien votre temps. Lisez attentivement les consignes et structurez vos réponses avec introduction, développement, conclusion.',
        icon: '🎯'
    },
    {
        id: 'motivation',
        category: 'Motivation',
        title: 'Remotiver',
        text: 'Ne vous découragez pas face aux difficultés. Chaque erreur est une opportunité d\'apprentissage. Vous avez déjà parcouru beaucoup de chemin !',
        icon: '💪'
    },
    {
        id: 'practice_more',
        category: 'Pratique',
        title: 'Plus de pratique',
        text: 'Je vous encourage à pratiquer plus régulièrement. La régularité (30 min/jour) est plus efficace que des sessions longues espacées.',
        icon: '⏰'
    }
];

export const FEEDBACK_CATEGORIES = [
    'Tous',
    'Encouragement',
    'Compréhension Orale',
    'Compréhension Écrite',
    'Expression Orale',
    'Expression Écrite',
    'Vocabulaire',
    'Grammaire',
    'Préparation Examen',
    'Motivation',
    'Pratique'
];
