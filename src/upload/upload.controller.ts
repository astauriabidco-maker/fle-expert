import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('audio')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAudio(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!file.mimetype.startsWith('audio/')) {
            // Allowing audio/webm, audio/mp3, etc.
            // Some browsers send audio/webm;codecs=opus, so strict equality might fail
        }

        const url = await this.uploadService.saveAudioFile(file);
        return { url };
    }
}
