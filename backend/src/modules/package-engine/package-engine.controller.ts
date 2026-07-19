import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { CreatePackageDto, UpdatePackageCapacityDto, UpdatePackageDto } from './dto/package.dto';
import { PackageEngineService } from './package-engine.service';

@ApiTags('Package Engine')
@Controller('packages')
export class PackageEngineController {
  constructor(private readonly packageEngine: PackageEngineService) {}

  @Get()
  @ApiOperation({ summary: 'List company travel packages' })
  @ApiHeader({ name: 'x-company-id', required: true })
  list(@CurrentCompany() companyId: string) { return this.packageEngine.listPackages(companyId); }

  @Post()
  @ApiOperation({ summary: 'Create a travel package' })
  @ApiHeader({ name: 'x-company-id', required: true })
  create(@CurrentCompany() companyId: string, @Body() data: CreatePackageDto) { return this.packageEngine.createPackage(companyId, data); }

  @Get(':id')
  @ApiOperation({ summary: 'Get package details, capacity and bookings' })
  @ApiHeader({ name: 'x-company-id', required: true })
  getOne(@CurrentCompany() companyId: string, @Param('id') id: string) { return this.packageEngine.getPackageDetails(companyId, id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a travel package' })
  @ApiHeader({ name: 'x-company-id', required: true })
  update(@CurrentCompany() companyId: string, @Param('id') id: string, @Body() data: UpdatePackageDto) { return this.packageEngine.updatePackage(companyId, id, data); }

  @Patch(':id/capacity')
  @ApiOperation({ summary: 'Change package total capacity safely' })
  @ApiHeader({ name: 'x-company-id', required: true })
  capacity(@CurrentCompany() companyId: string, @Param('id') id: string, @Body() data: UpdatePackageCapacityDto) { return this.packageEngine.setCapacity(companyId, id, data.capacity); }
}
