import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a365d',
        marginBottom: 5,
    },
    orgInfo: {
        width: '50%',
    },
    billingInfo: {
        width: '50%',
        textAlign: 'right',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: '#f7fafc',
        padding: 5,
        marginTop: 20,
        marginBottom: 10,
        color: '#2d3748',
    },
    table: {
        display: 'flex',
        width: 'auto',
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
        paddingVertical: 8,
    },
    tableHeader: {
        backgroundColor: '#edf2f7',
        fontWeight: 'bold',
    },
    col1: { width: '60%' },
    col2: { width: '20%', textAlign: 'right' },
    col3: { width: '20%', textAlign: 'right' },
    totalSection: {
        marginTop: 30,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        width: '40%',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#a0aec0',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
});

interface DevisProps {
    organization: any;
    user: any;
    proposal: any;
}

const DevisTemplate: React.FC<DevisProps> = ({ organization, user, proposal }) => {
    const date = new Date().toLocaleDateString('fr-FR');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.orgInfo}>
                        <Text style={styles.title}>DEVIS</Text>
                        <Text>{organization.name}</Text>
                        <Text>SIRET: 123 456 789 00012</Text>
                        <Text>Numéro de déclaration d'activité : 11 75 12345 75</Text>
                    </View>
                    <View style={styles.billingInfo}>
                        <Text>Date : {date}</Text>
                        <Text>Devis N° : DV-{proposal.id.substring(0, 8)}</Text>
                        <Text style={{ marginTop: 10 }}>À l'attention de :</Text>
                        <Text style={{ fontWeight: 'bold' }}>{user.name}</Text>
                        <Text>{user.email}</Text>
                    </View>
                </View>

                <View>
                    <Text style={styles.sectionTitle}>OBJET DE LA FORMATION</Text>
                    <Text>Parcours de formation linguistique sur-mesure (PREP TEF 2026)</Text>
                    <Text>Niveau initial : {proposal.baseLevel} | Niveau cible : {proposal.targetLevel}</Text>
                </View>

                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={styles.col1}>Désignation</Text>
                        <Text style={styles.col2}>Volume</Text>
                        <Text style={styles.col3}>Prix Unit.</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.col1}>Heures de formation (Présentiel / Distanciel / IA)</Text>
                        <Text style={styles.col2}>{proposal.estimatedHours}h</Text>
                        <Text style={styles.col3}>{proposal.hourlyRate.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.col1}>Accès illimité plateforme FLE Expert (IA + Modules)</Text>
                        <Text style={styles.col2}>Inclus</Text>
                        <Text style={styles.col3}>0.00€</Text>
                    </View>
                </View>

                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text>Total HT</Text>
                        <Text>{proposal.totalCost.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text>TVA (0% - Exonération Art. 261-4-4 du CGI)</Text>
                        <Text>0.00€</Text>
                    </View>
                    <View style={[styles.totalRow, { marginTop: 10, borderTopWidth: 1 }]}>
                        <Text style={{ fontWeight: 'bold' }}>TOTAL TTC</Text>
                        <Text style={{ fontWeight: 'bold' }}>{proposal.totalCost.toFixed(2)}€</Text>
                    </View>
                </View>

                <Text style={{ marginTop: 50, fontSize: 9 }}>
                    Devis valable 3 mois. Pour acceptation, veuillez retourner ce document signé accompagné de la mention "Bon pour accord".
                </Text>

                <View style={styles.footer}>
                    <Text>{organization.name} - Établissement de formation professionnelle</Text>
                </View>
            </Page>
        </Document>
    );
};

export default DevisTemplate;
