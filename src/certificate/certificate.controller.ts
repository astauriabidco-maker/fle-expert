import { Controller, Get, Param, Post, Res, Body, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CertificateService } from './certificate.service';
import { SecurityService } from '../common/services/security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('certificate')
export class CertificateController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly certificateService: CertificateService,
        private readonly securityService: SecurityService,
    ) { }

    @Get('verify/:hash')
    async verifyCertificate(@Param('hash') hash: string) {
        const session = await this.prisma.examSession.findUnique({
            where: { scoreHash: hash },
            include: { user: true, organization: true }
        });

        if (!session) {
            return { valid: false, message: "Certificat introuvable ou falsifié." };
        }

        return {
            valid: true,
            candidate: session.user.name,
            organization: session.organization.name,
            score: session.score,
            date: session.createdAt,
            level: session.estimatedLevel // Mapping to "estimatedLevel" as per schema
        };
    }

    // Temporary endpoint for manual testing/generation
    @Post('generate')
    @UseGuards(JwtAuthGuard)
    async generateCertificate(@Body() body: { name: string, score: number, level: string, orgName: string }, @Res() res: any) {
        const fakeId = 'demo-id';
        const date = new Date().toISOString();

        // Generate secure hash using existing logic
        const hash = this.securityService.generateResultHash(fakeId, body.score, date);

        const pdfBuffer = await this.certificateService.generatePdf(
            body.name,
            new Date().toLocaleDateString('fr-FR'),
            body.score,
            body.level,
            body.orgName,
            hash
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=certificate.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }

    @Get('download/:sessionId')
    @UseGuards(JwtAuthGuard)
    async downloadCertificate(@Param('sessionId') sessionId: string, @Res() res: any) {
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId },
            include: { user: true, organization: true }
        });

        if (!session || session.status !== 'COMPLETED' || !session.scoreHash) {
            // In real app maybe return 404 or 400
            return res.status(404).json({ message: "Certificat non disponible." });
        }

        // Ensure values are present (TS check)
        const score = session.score || 0;
        const level = session.estimatedLevel || "N/A";

        const pdfBuffer = await this.certificateService.generatePdf(
            session.user.name || "Candidat", // handle nullable name
            session.createdAt.toLocaleDateString('fr-FR'),
            score,
            level,
            session.organization.name,
            session.scoreHash
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=certificate-${sessionId}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }

    @Get('diagnostic/:sessionId')
    @UseGuards(JwtAuthGuard)
    async downloadDiagnosticCertificate(@Param('sessionId') sessionId: string, @Res() res: any) {
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId },
            include: { user: true, organization: true }
        });

        if (!session) {
            console.log(`[Certificate] Session ${sessionId} not found`);
            return res.status(404).json({ message: "Session introuvable." });
        }

        if (session.status !== 'COMPLETED') {
            console.log(`[Certificate] Session ${sessionId} status is ${session.status}, not COMPLETED`);
            return res.status(404).json({ message: `Attestation non disponible - session en cours (${session.status}).` });
        }

        if (!session.scoreHash) {
            console.log(`[Certificate] Session ${sessionId} has no scoreHash`);
            return res.status(404).json({ message: "Attestation non disponible - hash de vérification manquant." });
        }

        const score = session.score || 0;
        const level = session.estimatedLevel || "A1";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objective = (session.user as any).objective || "PROFESSIONAL";

        // Parse skills from breakdown JSON
        let skills = {};
        try {
            const raw = (session as any).breakdown;
            if (raw) {
                if (typeof raw === 'string') {
                    skills = JSON.parse(raw);
                } else if (typeof raw === 'object') {
                    skills = raw;
                }
            }
            console.log(`Generating PDF for session ${sessionId}. Skills found:`, Object.keys(skills).length);
        } catch (e) {
            console.error("Error parsing breakdown for PDF", e);
        }

        const pdfBuffer = await this.certificateService.generateDiagnosticPdf(
            session.user.name || "Candidat",
            session.createdAt.toLocaleDateString('fr-FR'),
            score,
            level,
            objective,
            skills,
            session.organization.name,
            session.scoreHash
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=attestation-positionnement-${sessionId}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }
}
