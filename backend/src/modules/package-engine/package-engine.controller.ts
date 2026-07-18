import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PackageEngineService } from './package-engine.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Package Engine')
@Controller('packages')
export class PackageEngineController {
  constructor(private readonly packageEngine: PackageEngineService) {}

  @Post()
  @ApiOperation({ summary: 'Create a dynamic travel package' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async create(@CurrentCompany() companyId: string, @Body() data: any) {
    return this.packageEngine.createPackage(companyId, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package details with itinerary' })
  async getOne(@Param('id') id: string) {
    return this.packageEngine.getPackageDetails(id);
  }
}
