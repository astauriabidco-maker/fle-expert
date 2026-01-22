
import { Injectable } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import * as QRCode from 'qrcode';
import * as React from 'react';
import CertificateTemplate from './templates/CertificateTemplate';
import DiagnosticCertificateTemplate from './templates/DiagnosticCertificateTemplate';

@Injectable()
export class CertificateService {
    async generateQrCode(url: string): Promise<string> {
        return QRCode.toDataURL(url);
    }

    async generatePdf(
        candidateName: string,
        examDate: string,
        score: number,
        level: string,
        organizationName: string,
        verificationHash: string
    ): Promise<Buffer> {
        console.log('Generating QR Code...');
        const verificationUrl = `https://prep-tef-2026.com/verify/${verificationHash}`;
        const qrCodeBase64 = await this.generateQrCode(verificationUrl); // Returns data:image/png;base64,...

        console.log('Rendering PDF...');

        const element = React.createElement(CertificateTemplate, {
            candidateName,
            examDate,
            score,
            level,
            organizationName,
            verificationHash,
            qrCodeBase64
        });

        return await renderToBuffer(element as any);
    }

    async generateDiagnosticPdf(
        candidateName: string,
        examDate: string,
        score: number,
        level: string,
        objective: string,
        skills: Record<string, number>,
        organizationName: string,
        verificationHash: string,
        organizationLogo?: string
    ): Promise<Buffer> {
        const verificationUrl = `https://prep-tef-2026.com/verify/${verificationHash}`;
        const qrCodeBase64 = await this.generateQrCode(verificationUrl);

        const element = React.createElement(DiagnosticCertificateTemplate, {
            candidateName,
            examDate,
            score,
            level,
            objective,
            skills,
            organizationName,
            verificationHash,
            qrCodeBase64,
            organizationLogo
        });

        return await renderToBuffer(element as any);
    }
}
