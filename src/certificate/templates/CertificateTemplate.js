"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var renderer_1 = require("@react-pdf/renderer");
// Register standard fonts
renderer_1.Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6dBNJ0WjP.ttf' }, // Simplified default
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6dBNJ0WjP.ttf', fontWeight: 'bold' },
    ],
});
var styles = renderer_1.StyleSheet.create({
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
var CertificateTemplate = function (_a) {
    var candidateName = _a.candidateName, examDate = _a.examDate, score = _a.score, level = _a.level, qrCodeBase64 = _a.qrCodeBase64, verificationHash = _a.verificationHash, organizationName = _a.organizationName;
    return (<renderer_1.Document>
        <renderer_1.Page size="A4" style={styles.page}>
            <renderer_1.View style={styles.border}>
                <renderer_1.View>
                    <renderer_1.View style={styles.header}>
                        <renderer_1.Text style={styles.logoText}>PrepTEF 2026</renderer_1.Text>
                        <renderer_1.Text style={styles.subLogoText}>CERTIFICATION OFFICIELLE</renderer_1.Text>
                    </renderer_1.View>

                    <renderer_1.Text style={styles.title}>ATTESTATION DE RÉUSSITE</renderer_1.Text>
                    <renderer_1.Text style={styles.subtitle}>Délivrée par {organizationName}</renderer_1.Text>

                    <renderer_1.View style={styles.content}>
                        <renderer_1.Text style={styles.text}>Nous certifions que</renderer_1.Text>
                        <renderer_1.Text style={[styles.text, styles.candidateName]}>{candidateName}</renderer_1.Text>
                        <renderer_1.Text style={styles.text}>a passé avec succès l'examen le {examDate}</renderer_1.Text>

                        <renderer_1.View style={styles.scoreSection}>
                            <renderer_1.Text style={styles.scoreTitle}>NIVEAU ESTIMÉ</renderer_1.Text>
                            <renderer_1.Text style={[styles.scoreValue, { color: '#2563eb', fontSize: 28, marginBottom: 10 }]}>{level}</renderer_1.Text>

                            <renderer_1.Text style={styles.scoreTitle}>SCORE GLOBAL</renderer_1.Text>
                            <renderer_1.Text style={styles.scoreValue}>{score} / 699</renderer_1.Text>
                        </renderer_1.View>
                    </renderer_1.View>
                </renderer_1.View>

                <renderer_1.View style={styles.footer}>
                    <renderer_1.View style={styles.hashSection}>
                        <renderer_1.Text style={styles.hashLabel}>CODE DE SÉCURITÉ (SHA-256)</renderer_1.Text>
                        <renderer_1.Text style={styles.hashValue}>{verificationHash}</renderer_1.Text>
                        <renderer_1.Text style={[styles.hashLabel, { marginTop: 5 }]}>Vérifiable sur : https://prep-tef-2026.com/verify/{verificationHash}</renderer_1.Text>
                    </renderer_1.View>

                    <renderer_1.View style={styles.qrSection}>
                        <renderer_1.Image src={qrCodeBase64} style={styles.qrCode}/>
                    </renderer_1.View>
                </renderer_1.View>
            </renderer_1.View>
        </renderer_1.Page>
    </renderer_1.Document>);
};
exports.default = CertificateTemplate;
