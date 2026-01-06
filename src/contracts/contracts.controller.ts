import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Post()
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    create(@Body() createContractDto: CreateContractDto) {
        return this.contractsService.create(createContractDto);
    }

    @Get()
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    findAll(@Query('organizationId') organizationId?: string) {
        return this.contractsService.findAll(organizationId);
    }

    @Get(':id')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    findOne(@Param('id') id: string) {
        return this.contractsService.findOne(id);
    }

    @Get('user/:userId')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'COACH')
    findByUser(@Param('userId') userId: string) {
        return this.contractsService.findByFormateur(userId);
    }

    @Patch(':id')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto) {
        return this.contractsService.update(id, updateContractDto);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN')
    remove(@Param('id') id: string) {
        return this.contractsService.remove(id);
    }
}
