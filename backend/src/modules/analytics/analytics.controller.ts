import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Reports & Business Intelligence')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/executive')
  @ApiOperation({ summary: 'Get real-time Executive Dashboard metrics' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getExecutive(@CurrentCompany() companyId: string) {
    return this.analyticsService.getExecutiveDashboard(companyId);
  }

  @Post('copilot/ask')
  @ApiOperation({
    summary: 'Ask AI Copilot for business insights (Natural Language)',
  })
  @ApiHeader({ name: 'x-company-id', required: true })
  async ask(
    @CurrentCompany() companyId: string,
    @Body() body: { question: string },
  ) {
    return this.analyticsService.askCopilot(companyId, body.question);
  }

  @Get('reports/export')
  @ApiOperation({ summary: 'Export business reports in multiple formats' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async export(
    @CurrentCompany() companyId: string,
    @Query('type') type: string,
    @Query('format') format: 'PDF' | 'EXCEL' | 'CSV',
  ) {
    return this.analyticsService.generateReport(companyId, type, format);
  }
}
