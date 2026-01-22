import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads', 'audio');

    constructor() {
        this.ensureUploadDirExists();
    }

    private ensureUploadDirExists() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveAudioFile(file: Express.Multer.File): Promise<string> {
        const fileExtension = path.extname(file.originalname) || '.webm';
        const filename = `${crypto.randomUUID()}${fileExtension}`;
        const filePath = path.join(this.uploadDir, filename);

        await fs.promises.writeFile(filePath, file.buffer);

        // Return a relative path or a full URL depending on how static assets are served
        // For now, returning a relative path that can be served via a static route
        return `/uploads/audio/${filename}`;
    }
}
