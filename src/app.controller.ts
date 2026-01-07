import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  async getStatus() {
    const maintenance = await this.prisma.systemSetting.findUnique({
      where: { key: 'maintenance_mode' }
    });
    return {
      maintenance: maintenance?.value === 'true',
      version: '1.2.0'
    };
  }
}
