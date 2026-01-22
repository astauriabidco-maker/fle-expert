import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './client/public/uploads/media',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async uploadFile(@UploadedFile() file: any) {
        return this.mediaService.saveMediaRecord(file);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getAllMedia() {
        return this.mediaService.findAll();
    }
}
