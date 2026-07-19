import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { VisaService } from './visa.service';
import { CreateVisaApplicationDto } from './dto/create-visa-application.dto';
import { UpdateVisaStatusDto } from './dto/update-visa-status.dto';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Visa Operations')
@Controller('visa')
export class VisaController {
  constructor(private readonly visaService: VisaService) {}

  @Post('applications')
  @ApiOperation({ summary: 'Create a new visa application' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async create(
    @CurrentCompany() companyId: string,
    @Body() data: CreateVisaApplicationDto,
  ) {
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
  async updateStatus(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() body: UpdateVisaStatusDto,
  ) {
    return this.visaService.updateStatus(
      companyId,
      id,
      body.status,
      body.actorId,
      body.notes,
    );
  }
}
