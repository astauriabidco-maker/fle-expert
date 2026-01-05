import React from 'react';
import {
    Page,
    Text,
    View,
    Document,
    StyleSheet,
    Image,
    Font,
} from '@react-pdf/renderer';

// Register standard fonts
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6dBNJ0WjP.ttf' },
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6dBNJ0WjP.ttf', fontWeight: 'bold' },
    ],
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    border: {
        border: '2px solid #2563eb', // Blue-600
        height: '100%',
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 5,
    },
    subLogoText: {
        fontSize: 10,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
        color: '#475569',
        marginBottom: 30,
    },
    content: {
        marginBottom: 30,
    },
    text: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 1.5,
        color: '#334155',
    },
    candidateName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginVertical: 5,
    },
    mainScoreSection: {
        marginVertical: 20,
        padding: 20,
        backgroundColor: '#eff6ff', // Blue-50
        borderRadius: 8,
        alignItems: 'center',
        border: '1px solid #dbeafe',
    },
    levelBadge: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 5,
    },
    scoreGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginTop: 20,
    },
    skillBox: {
        width: '45%',
        padding: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        alignItems: 'center',
        border: '1px solid #e2e8f0',
        marginBottom: 10,
    },
    skillTitle: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    skillValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#334155',
    },
    footer: {
        marginTop: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTop: '1px solid #e2e8f0',
        paddingTop: 20,
    },
    hashSection: {
        width: '70%',
    },
    hashLabel: {
        fontSize: 8,
        color: '#94a3b8',
        marginBottom: 2,
    },
    hashValue: {
        fontSize: 8,
        fontFamily: 'Courier',
        color: '#64748b',
        maxWidth: '100%',
    },
    qrSection: {
        width: '25%',
        alignItems: 'flex-end',
    },
    qrCode: {
        width: 60,
        height: 60,
    },
});

interface DiagnosticCertificateProps {
    candidateName: string;
    examDate: string;
    score: number;
    level: string;
    objective: string;
    skills: Record<string, number>;
    qrCodeBase64: string;
    verificationHash: string;
    organizationName: string;
}

const DiagnosticCertificateTemplate: React.FC<DiagnosticCertificateProps> = ({
    candidateName,
    examDate,
    score,
    level,
    objective,
    skills,
    qrCodeBase64,
    verificationHash,
    organizationName,
}) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.border}>
                <View>
                    <View style={styles.header}>
                        <Text style={styles.logoText}>PrepTEF 2026</Text>
                        <Text style={styles.subLogoText}>POSITIONNEMENT INITIAL</Text>
                    </View>

                    <Text style={styles.title}>ATTESTATION DE NIVEAU</Text>
                    <Text style={styles.subtitle}>Évaluation réalisée par {organizationName}</Text>

                    <View style={styles.content}>
                        <Text style={styles.text}>Ce document atteste que</Text>
                        <Text style={[styles.text, styles.candidateName]}>{candidateName}</Text>
                        <Text style={styles.text}>a complété une évaluation diagnostique complète le {examDate}</Text>
                        <Text style={[styles.text, { fontSize: 10, color: '#64748b', marginTop: 5 }]}>Objectif déclaré : {objective}</Text>

                        <View style={styles.mainScoreSection}>
                            <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 5 }}>NIVEAU GLOBAL ESTIMÉ (CECRL)</Text>
                            <Text style={styles.levelBadge}>{level}</Text>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b' }}>Score Global : {score} / 699</Text>
                        </View>

                        <Text style={[styles.text, { fontWeight: 'bold', marginTop: 10 }]}>Détail par Compétence</Text>
                        <View style={styles.scoreGrid}>
                            <View style={styles.skillBox}>
                                <Text style={styles.skillTitle}>Compréhension Orale</Text>
                                <Text style={styles.skillValue}>{skills.CO || 0} %</Text>
                            </View>
                            <View style={styles.skillBox}>
                                <Text style={styles.skillTitle}>Compréhension Écrite</Text>
                                <Text style={styles.skillValue}>{skills.CE || 0} %</Text>
                            </View>
                            <View style={styles.skillBox}>
                                <Text style={styles.skillTitle}>Grammaire & Lexique</Text>
                                <Text style={styles.skillValue}>{Math.round(((skills.Grammaire || 0) + (skills.Vocabulaire || 0)) / 2)} %</Text>
                            </View>
                            <View style={styles.skillBox}>
                                <Text style={styles.skillTitle}>Expression (Estimé)</Text>
                                <Text style={styles.skillValue}>{Math.round(((skills.EO || 0) + (skills.EE || 0)) / 2)} %</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.hashSection}>
                        <Text style={styles.hashLabel}>ID UNIQUE DE SESSION</Text>
                        <Text style={styles.hashValue}>{verificationHash}</Text>
                        <Text style={[styles.hashLabel, { marginTop: 5 }]}>Document généré automatiquement le {new Date().toLocaleDateString('fr-FR')}</Text>
                    </View>

                    <View style={styles.qrSection}>
                        <Image src={qrCodeBase64} style={styles.qrCode} />
                    </View>
                </View>
            </View>
        </Page>
    </Document>
);

export default DiagnosticCertificateTemplate;
