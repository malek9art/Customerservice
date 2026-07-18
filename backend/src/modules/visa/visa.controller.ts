import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { VisaService } from './visa.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Visa Operations')
@Controller('visa')
export class VisaController {
  constructor(private readonly visaService: VisaService) {}

  @Post('applications')
  @ApiOperation({ summary: 'Create a new visa application' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async create(@CurrentCompany() companyId: string, @Body() data: any) {
    return this.visaService.createApplication(companyId, data);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Visa Operations Dashboard' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getDashboard(@CurrentCompany() companyId: string) {
    return this.visaService.getDashboard(companyId);
  }

  @Patch('applications/:id/status')
  @ApiOperation({ summary: 'Update visa application status' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.visaService.updateStatus(
      id,
      body.status,
      body.actorId,
      body.notes,
    );
  }
}
