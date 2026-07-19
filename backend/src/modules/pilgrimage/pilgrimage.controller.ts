import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { BusAllocationDto, CancelPilgrimageBookingDto, CreatePilgrimageBookingDto, GroupAllocationDto, ModifyPilgrimageBookingDto, RoomAllocationDto } from './dto/pilgrimage.dto';
import { PilgrimageService } from './pilgrimage.service';

@ApiTags('Pilgrimage Operations (Hajj & Umrah)')
@Controller('pilgrimage')
export class PilgrimageController {
  constructor(private readonly pilgrimageService: PilgrimageService) {}

  @Post('bookings') @ApiOperation({ summary: 'Create Hajj or Umrah booking' }) @ApiHeader({ name: 'x-company-id', required: true })
  book(@CurrentCompany() companyId: string, @Body() body: CreatePilgrimageBookingDto) { return this.pilgrimageService.createPilgrimageBooking(companyId, body.customerId, body.packageId, body.pilgrims); }

  @Post('bookings/:id/cancel') @ApiHeader({ name: 'x-company-id', required: true })
  cancelBooking(@CurrentCompany() companyId: string, @Param('id') id: string, @Body() body: CancelPilgrimageBookingDto) { return this.pilgrimageService.cancelBooking(companyId, id, body.reason); }

  @Patch('bookings/:id/modify') @ApiHeader({ name: 'x-company-id', required: true })
  modifyBooking(@CurrentCompany() companyId: string, @Param('id') id: string, @Body() body: ModifyPilgrimageBookingDto) { return this.pilgrimageService.modifyBooking(companyId, id, body); }

  @Post('room-allocation') @ApiHeader({ name: 'x-company-id', required: true })
  allocateRooms(@CurrentCompany() companyId: string, @Body() body: RoomAllocationDto) { return this.pilgrimageService.allocateRooms(companyId, body.packageId, { maxRoomCapacity: body.maxRoomCapacity }); }

  @Post('bus-allocation') @ApiHeader({ name: 'x-company-id', required: true })
  allocateBuses(@CurrentCompany() companyId: string, @Body() body: BusAllocationDto) { return this.pilgrimageService.allocateBuses(companyId, body.packageId, { busCapacity: body.busCapacity }); }

  @Post('packages/:packageId/capacity-sync') @ApiHeader({ name: 'x-company-id', required: true })
  syncCapacity(@CurrentCompany() companyId: string, @Param('packageId') id: string) { return this.pilgrimageService.syncPackageCapacity(companyId, id); }

  @Post('pilgrims/:pilgrimId/digital-card') @ApiHeader({ name: 'x-company-id', required: true })
  generateCard(@CurrentCompany() companyId: string, @Param('pilgrimId') id: string) { return this.pilgrimageService.generatePilgrimCard(companyId, id); }

  @Get('dashboard') @ApiHeader({ name: 'x-company-id', required: true })
  getDashboard(@CurrentCompany() companyId: string, @Query('type') type: string) { return this.pilgrimageService.getOperationsDashboard(companyId, type); }

  @Post('allocate-group') @ApiHeader({ name: 'x-company-id', required: true })
  allocate(@CurrentCompany() companyId: string, @Body() body: GroupAllocationDto) { return this.pilgrimageService.allocateToGroup(companyId, body.pilgrimId, body.groupId); }
}
