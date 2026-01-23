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

    async sendB2CWelcome(email: string, name: string, tempPassword: string, refundCode: string) {
        const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const loginUrl = `${frontendUrl}/login`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #334155;
            line-height: 1.7;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            border-radius: 12px 12px 0 0;
            color: white;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e2e8f0;
            border-top: none;
            border-radius: 0 0 12px 12px;
        }
        .credentials-box {
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .credential-label {
            font-size: 0.85em;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .credential-value {
            font-size: 1.4em;
            font-weight: bold;
            color: #1e293b;
            font-family: 'Courier New', monospace;
            background: #ffffff;
            padding: 8px 16px;
            border-radius: 6px;
            display: inline-block;
            margin-top: 5px;
        }
        .button {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }
        .refund-info {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            text-align: center;
            font-size: 0.8em;
            color: #94a3b8;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body style="background-color: #f1f5f9; margin: 0; padding: 20px;">
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 1.8em;">🎓 Bienvenue sur PrepTEF</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Votre diagnostic CECRL vous attend</p>
        </div>
        
        <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>
            
            <p>Merci pour votre achat ! Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>
            
            <div class="credentials-box">
                <div style="margin-bottom: 20px;">
                    <div class="credential-label">📧 Adresse email</div>
                    <div class="credential-value">${email}</div>
                </div>
                <div>
                    <div class="credential-label">🔑 Mot de passe temporaire</div>
                    <div class="credential-value">${tempPassword}</div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Commencer mon diagnostic</a>
            </div>
            
            <p style="font-size: 0.9em; color: #64748b; text-align: center;">
                Vous serez invité à changer votre mot de passe lors de votre première connexion.
            </p>
            
            <div class="refund-info">
                <strong>💳 Code de remboursement</strong>
                <p style="margin: 5px 0 0 0;">Conservez précieusement ce code en cas de demande de remboursement :</p>
                <p style="font-family: monospace; font-weight: bold; font-size: 1.1em; margin: 10px 0 0 0;">${refundCode}</p>
            </div>
            
            <h3>Prochaines étapes :</h3>
            <ol style="padding-left: 20px;">
                <li><strong>Connectez-vous</strong> avec vos identifiants ci-dessus</li>
                <li><strong>Passez le diagnostic</strong> (environ 20 minutes)</li>
                <li><strong>Recevez votre niveau CECRL</strong> avec un plan de formation personnalisé</li>
            </ol>
        </div>
        
        <div class="footer">
            <p>© 2026 PrepTEF - La plateforme intelligente pour réussir vos examens de français.</p>
            <p style="font-size: 0.9em;">
                Une question ? Répondez directement à cet email.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        try {
            if (!this.resend) {
                console.log(`[EMAIL] Simulation - B2C Welcome to ${email} | Password: ${tempPassword} | Refund: ${refundCode}`);
                return { id: 'simulated-b2c-welcome' };
            }
            const { data, error } = await this.resend.emails.send({
                from: `PrepTEF <${fromEmail}>`,
                to: email,
                subject: `🔑 Vos identifiants PrepTEF – Commencez votre diagnostic`,
                html: html,
            });
            if (error) throw error;
            console.log(`[EMAIL] B2C Welcome sent: ${data?.id} to ${email}`);
            return data;
        } catch (error) {
            console.error('[EMAIL] Failed to send B2C welcome:', error);
            // Don't throw - email failure shouldn't block user creation
        }
    }
}
