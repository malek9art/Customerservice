import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SaasService } from './saas.service';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';

@ApiTags('SaaS Management & Provisioning')
@Controller('saas')
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  @Post('provision')
  @ApiOperation({ summary: 'Onboard a new travel agency tenant' })
  async onboard(@Body() data: ProvisionTenantDto) {
    return this.saasService.onBoardTenant(data);
  }

  @Get('platform-stats')
  @ApiOperation({ summary: 'Global platform health and billing metrics' })
  async getStats() {
    return this.saasService.getPlatformMetrics();
  }

  @Get('tenants/:id/quota-check')
  @ApiOperation({ summary: 'Verify tenant quota for a specific feature' })
  async checkQuota(@Param('id') id: string, @Query('metric') metric: string) {
    return this.saasService.checkQuota(id, metric);
  }
}
