import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Admin Command Center')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('command-center')
  @ApiOperation({ summary: 'Get Unified Command Center data' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getCommandCenter(@CurrentCompany() companyId: string) {
    return this.adminService.getCommandCenter(companyId);
  }

  @Get('ai-config')
  @ApiOperation({ summary: 'Manage AI Agents and Prompts' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getAiConfig(@CurrentCompany() companyId: string) {
    return this.adminService.getAiConfig(companyId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Explore system logs' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getLogs(@CurrentCompany() companyId: string) {
    return this.adminService.getSystemLogs(companyId);
  }
}
