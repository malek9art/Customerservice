import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PilgrimageService } from './pilgrimage.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Pilgrimage Operations (Hajj & Umrah)')
@Controller('pilgrimage')
export class PilgrimageController {
  constructor(private readonly pilgrimageService: PilgrimageService) {}

  @Post('bookings')
  @ApiOperation({ summary: 'Create a Hajj or Umrah booking for pilgrims' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async book(
    @CurrentCompany() companyId: string,
    @Body() body: { customerId: string; packageId: string; pilgrims: any[] },
  ) {
    return this.pilgrimageService.createPilgrimageBooking(
      companyId,
      body.customerId,
      body.packageId,
      body.pilgrims,
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Pilgrimage Operations Dashboard' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getDashboard(
    @CurrentCompany() companyId: string,
    @Query('type') type: string,
  ) {
    return this.pilgrimageService.getOperationsDashboard(companyId, type);
  }

  @Post('allocate-group')
  @ApiOperation({ summary: 'Allocate a pilgrim to a specific group/bus' })
  async allocate(@Body() body: { pilgrimId: string; groupId: string }) {
    return this.pilgrimageService.allocateToGroup(body.pilgrimId, body.groupId);
  }
}
