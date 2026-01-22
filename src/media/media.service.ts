import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
    constructor(private readonly prisma: PrismaService) { }

    async saveMediaRecord(file: any) {
        // Construct public URL (assuming client serves /uploads)
        // In Prod, this would be an S3 URL
        const publicUrl = `/uploads/media/${file.filename}`;

        return this.prisma.mediaAsset.create({
            data: {
                filename: file.originalname,
                url: publicUrl,
                type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'AUDIO',
                size: file.size,
                mimeType: file.mimetype
            }
        });
    }

    async findAll() {
        return this.prisma.mediaAsset.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
}
