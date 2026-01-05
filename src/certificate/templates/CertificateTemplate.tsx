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
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6dBNJ0WjP.ttf' }, // Simplified default
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
        border: '2px solid #1e3a8a', // Blue-900 like
        height: '100%',
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
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
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        color: '#475569',
        marginBottom: 40,
    },
    content: {
        marginBottom: 40,
    },
    text: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 1.5,
        color: '#334155',
    },
    candidateName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginVertical: 10,
    },
    scoreSection: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        alignItems: 'center',
    },
    scoreTitle: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 5,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
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

interface CertificateProps {
    candidateName: string;
    examDate: string;
    score: number;
    level: string;
    qrCodeBase64: string;
    verificationHash: string;
    organizationName: string;
}

const CertificateTemplate: React.FC<CertificateProps> = ({
    candidateName,
    examDate,
    score,
    level,
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
                        <Text style={styles.subLogoText}>CERTIFICATION OFFICIELLE</Text>
                    </View>

                    <Text style={styles.title}>ATTESTATION DE RÉUSSITE</Text>
                    <Text style={styles.subtitle}>Délivrée par {organizationName}</Text>

                    <View style={styles.content}>
                        <Text style={styles.text}>Nous certifions que</Text>
                        <Text style={[styles.text, styles.candidateName]}>{candidateName}</Text>
                        <Text style={styles.text}>a passé avec succès l'examen le {examDate}</Text>

                        <View style={styles.scoreSection}>
                            <Text style={styles.scoreTitle}>NIVEAU ESTIMÉ</Text>
                            <Text style={[styles.scoreValue, { color: '#2563eb', fontSize: 28, marginBottom: 10 }]}>{level}</Text>

                            <Text style={styles.scoreTitle}>SCORE GLOBAL</Text>
                            <Text style={styles.scoreValue}>{score} / 699</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.hashSection}>
                        <Text style={styles.hashLabel}>CODE DE SÉCURITÉ (SHA-256)</Text>
                        <Text style={styles.hashValue}>{verificationHash}</Text>
                        <Text style={[styles.hashLabel, { marginTop: 5 }]}>Vérifiable sur : https://prep-tef-2026.com/verify/{verificationHash}</Text>
                    </View>

                    <View style={styles.qrSection}>
                        <Image src={qrCodeBase64} style={styles.qrCode} />
                    </View>
                </View>
            </View>
        </Page>
    </Document>
);

export default CertificateTemplate;
