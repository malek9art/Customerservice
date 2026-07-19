import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { AdminService } from './admin.service';
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  UpdateSystemSettingsDto,
} from './dto/admin.dto';

@ApiTags('Admin Command Center')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get('command-center')
  @ApiHeader({ name: 'x-company-id', required: true })
  command(@CurrentCompany() id: string) {
    return this.adminService.getCommandCenter(id);
  }
  @Get('users') @ApiHeader({ name: 'x-company-id', required: true }) users(
    @CurrentCompany() id: string,
  ) {
    return this.adminService.listUsers(id);
  }
  @Post('users') @ApiHeader({ name: 'x-company-id', required: true }) create(
    @CurrentCompany() id: string,
    @Body() body: CreateAdminUserDto,
  ) {
    return this.adminService.createUser(id, body);
  }
  @Patch('users/:id')
  @ApiHeader({ name: 'x-company-id', required: true })
  update(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() body: UpdateAdminUserDto,
  ) {
    return this.adminService.updateUser(companyId, id, body);
  }
  @Get('ai-config') @ApiHeader({ name: 'x-company-id', required: true }) ai(
    @CurrentCompany() id: string,
  ) {
    return this.adminService.getAiConfig(id);
  }
  @Get('logs') @ApiHeader({ name: 'x-company-id', required: true }) logs(
    @CurrentCompany() id: string,
  ) {
    return this.adminService.getSystemLogs(id);
  }
  @Get('settings')
  @ApiHeader({ name: 'x-company-id', required: true })
  settings(@CurrentCompany() id: string) {
    return this.adminService.getSettings(id);
  }
  @Patch('settings')
  @ApiHeader({ name: 'x-company-id', required: true })
  updateSettings(
    @CurrentCompany() id: string,
    @Body() body: UpdateSystemSettingsDto,
  ) {
    return this.adminService.updateSettings(id, body.settings);
  }
}
