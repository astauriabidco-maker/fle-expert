import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend | null = null;

    constructor() {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
            this.resend = new Resend(apiKey);
        } else {
            console.warn('[EMAIL] RESEND_API_KEY not found. Email features will be disabled.');
        }
    }

    async sendStudentInvite(email: string, inviteLink: string, organizationName: string) {
        const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .button {
            background-color: #2563eb;
            color: white !important;
            padding: 14px 25px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            display: inline-block;
        }
        .container {
            font-family: sans-serif;
            color: #334155;
            line-height: 1.6;
            max-width: 600px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Bonjour,</h2>
        
        <p>Votre centre de formation, <strong>${organizationName}</strong>, vous a invité à rejoindre la plateforme <strong>PrepTEF 2026</strong> pour préparer votre examen de français.</p>
        
        <p>PrepTEF utilise l'intelligence artificielle pour identifier vos points forts et vos lacunes, afin de vous proposer un parcours d'entraînement 100% personnalisé.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" class="button">Activer mon accès candidat</a>
        </div>
        <h3>Pourquoi commencer dès maintenant ?</h3>
        <ul>
            <li><strong>Test de positionnement :</strong> Évaluez votre niveau CECRL réel en 15 minutes.</li>
            <li><strong>Parcours adaptatif :</strong> Ne révisez que ce dont vous avez besoin.</li>
            <li><strong>Examen blanc :</strong> Pratiquez dans les conditions réelles avec correction instantanée.</li>
        </ul>
        <p style="font-size: 0.9em; color: #64748b;">
            Ce lien d'invitation est valable pendant 7 jours. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="text-align: center; font-size: 0.8em; color: #94a3b8;">
            © 2026 PrepTEF - La plateforme intelligente pour réussir vos examens de français.
        </p>
    </div>
</body>
</html>
        `;

        try {
            if (!this.resend) {
                console.log(`[EMAIL] Simulation - Link: ${inviteLink} to ${email}`);
                return { id: 'simulated-id' };
            }
            const { data, error } = await this.resend.emails.send({
                from: `PrepTEF <${fromEmail}>`,
                to: email,
                subject: `🚀 Votre préparation au [TEF/TCF] commence ici – Bienvenue sur PrepTEF 2026`,
                html: html,
            });
            if (error) throw error;
            console.log(`[EMAIL] Sent: ${data?.id} to ${email}`);
            return data;
        } catch (error) {
            console.error('[EMAIL] Failed to send student invite:', error);
            throw error;
        }
    }

    async sendAchievementCongratulation(email: string, name: string, level: string) {
        const fromEmail = process.env.FROM_EMAIL || 'notifications@resend.dev';
        const html = `
            <h2>Félicitations ${name} ! 🎉</h2>
            <p>Vous avez atteint le niveau <strong>${level}</strong> sur PrepTEF.</p>
            <p>Vos efforts portent leurs fruits. Continuez à vous entraîner pour atteindre vos objectifs !</p>
            <br/>
            <a href="https://prep-tef.com/dashboard" style="background:#2563eb; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Voir mon tableau de bord</a>
        `;

        try {
            if (!this.resend) return;
            await this.resend.emails.send({
                from: `PrepTEF <${fromEmail}>`,
                to: email,
                subject: `🎉 Félicitations ! Nouveau niveau atteint : ${level}`,
                html
            });
        } catch (e) {
            console.error('[EMAIL] Failed to send achievement email', e);
        }
    }

    async sendCivicReminder(email: string, name: string) {
        const fromEmail = process.env.FROM_EMAIL || 'notifications@resend.dev';
        const html = `
            <h2>🇫🇷 Préparez votre naturalisation</h2>
            <p>Bonjour ${name},</p>
            <p>N'oubliez pas de compléter votre parcours citoyen. C'est une étape cruciale pour réussir votre entretien à la préfecture.</p>
            <br/>
            <a href="https://prep-tef.com/dashboard" style="background:#059669; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Accéder au Parcours Citoyen</a>
        `;

        try {
            if (!this.resend) return;
            await this.resend.emails.send({
                from: `PrepTEF <${fromEmail}>`,
                to: email,
                subject: `🇫🇷 Rappel : Votre préparation à l'entretien de naturalisation`,
                html
            });
        } catch (e) {
            console.error('[EMAIL] Failed to send civic reminder email', e);
        }
    }
}
