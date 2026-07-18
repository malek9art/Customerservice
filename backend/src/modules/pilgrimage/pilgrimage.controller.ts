import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiParam, ApiBody } from '@nestjs/swagger';
import { PilgrimageService, RoomAllocationOptions, BusAllocationOptions } from './pilgrimage.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Pilgrimage Operations (Hajj & Umrah)')
@Controller('pilgrimage')
export class PilgrimageController {
  constructor(private readonly pilgrimageService: PilgrimageService) {}

  @Post('bookings')
  @ApiOperation({ summary: 'Create a Hajj or Umrah booking for pilgrims with real-time capacity check' })
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

  @Post('room-allocation')
  @ApiOperation({ summary: 'Execute intelligent Pilgrim Room Allocation algorithm' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async allocateRooms(
    @CurrentCompany() companyId: string,
    @Body() body: { packageId: string; options?: RoomAllocationOptions },
  ) {
    return this.pilgrimageService.allocateRooms(
      companyId,
      body.packageId,
      body.options,
    );
  }

  @Post('bus-allocation')
  @ApiOperation({ summary: 'Execute intelligent Pilgrim Bus & Group Allocation algorithm' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async allocateBuses(
    @CurrentCompany() companyId: string,
    @Body() body: { packageId: string; options?: BusAllocationOptions },
  ) {
    return this.pilgrimageService.allocateBuses(
      companyId,
      body.packageId,
      body.options,
    );
  }

  @Post('packages/:packageId/capacity-sync')
  @ApiOperation({ summary: 'Real-time sync of package capacity and remaining slots' })
  @ApiHeader({ name: 'x-company-id', required: true })
  @ApiParam({ name: 'packageId', description: 'Package ID' })
  async syncCapacity(
    @CurrentCompany() companyId: string,
    @Param('packageId') packageId: string,
  ) {
    return this.pilgrimageService.syncPackageCapacity(companyId, packageId);
  }

  @Post('pilgrims/:pilgrimId/digital-card')
  @ApiOperation({ summary: 'Generate official PDF Digital Pilgrim Card' })
  @ApiHeader({ name: 'x-company-id', required: true })
  @ApiParam({ name: 'pilgrimId', description: 'Pilgrim ID' })
  async generateCard(
    @CurrentCompany() companyId: string,
    @Param('pilgrimId') pilgrimId: string,
  ) {
    return this.pilgrimageService.generatePilgrimCard(companyId, pilgrimId);
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
  @ApiOperation({ summary: 'Manually allocate a pilgrim to a specific group/bus' })
  async allocate(@Body() body: { pilgrimId: string; groupId: string }) {
    return this.pilgrimageService.allocateToGroup(body.pilgrimId, body.groupId);
  }
}
