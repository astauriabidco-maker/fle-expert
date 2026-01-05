import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        lineHeight: 1.5,
    },
    header: {
        textAlign: 'center',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#1a365d',
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a365d',
    },
    subtitle: {
        fontSize: 12,
        color: '#718096',
        marginTop: 5,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: '#ebf8ff',
        padding: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#3182ce',
        marginBottom: 10,
        color: '#2a4365',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '30%',
        fontWeight: 'bold',
        color: '#4a5568',
    },
    value: {
        width: '70%',
        color: '#2d3748',
    },
    moduleBox: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 10,
        marginBottom: 10,
        borderRadius: 4,
    },
    moduleTitle: {
        fontWeight: 'bold',
        color: '#3182ce',
        marginBottom: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#a0aec0',
        fontSize: 8,
    },
});

interface PlanProps {
    organization: any;
    user: any;
    proposal: any;
}

const TrainingPlanTemplate: React.FC<PlanProps> = ({ organization, user, proposal }) => {
    const modules = JSON.parse(proposal.planModules || '[]');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>PLAN DE FORMATION PERSONNALISÉ</Text>
                    <Text style={styles.subtitle}>Conformément aux exigences Qualiopi / France Travail</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INFORMATIONS GÉNÉRALES</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Stagiaire :</Text>
                        <Text style={styles.value}>{user.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Organisme :</Text>
                        <Text style={styles.value}>{organization.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Niveau Visé :</Text>
                        <Text style={styles.value}>{proposal.targetLevel} (CECRL)</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Volume Horaire :</Text>
                        <Text style={styles.value}>{proposal.estimatedHours} heures</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>OBJECTIFS PÉDAGOGIQUES</Text>
                    <Text>- Acquérir les compétences linguistiques nécessaires pour le niveau {proposal.targetLevel}.</Text>
                    <Text>- Maîtriser les structures grammaticales et lexicales du niveau visé.</Text>
                    <Text>- Développer la fluidité en expression orale et écrite.</Text>
                    <Text>- Se préparer aux épreuves spécifiques de la certification (TCF/TEF/DELF).</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PROGRAMME DÉTAILLÉ</Text>
                    {modules.map((m: string, i: number) => (
                        <View key={i} style={styles.moduleBox}>
                            <Text style={styles.moduleTitle}>Thème {i + 1} : {m}</Text>
                            <Text style={{ fontSize: 9, color: '#4a5568' }}>
                                Activités : Cours interactifs, exercices assistés par IA, mises en situation réelles et évaluations intermédiaires.
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MÉTHODES ET MOYENS TECHNIQUES</Text>
                    <Text>• Plateforme numérique FLE Expert accessible 24h/24.</Text>
                    <Text>• Algorithme d'apprentissage adaptatif IA.</Text>
                    <Text>• Suivi synchrone avec un coach formateur certifié (selon option).</Text>
                    <Text>• Supports pédagogiques numériques et tests blancs.</Text>
                </View>

                <View style={styles.footer}>
                    <Text>Généré le {new Date().toLocaleDateString()} par FLE Expert System</Text>
                </View>
            </Page>
        </Document>
    );
};

export default TrainingPlanTemplate;
