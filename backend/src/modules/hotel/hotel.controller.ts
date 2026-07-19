import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { CancelHotelBookingDto } from './dto/cancel-hotel-booking.dto';
import { CreateHotelBookingDto } from './dto/create-hotel-booking.dto';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import { UpdateHotelBookingDto } from './dto/update-hotel-booking.dto';
import { HotelBookingService } from './hotel-booking.service';

@ApiTags('Hotel Operations')
@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelBookingService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search available hotels and room inventory' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async search(
    @CurrentCompany() companyId: string,
    @Body() criteria: SearchHotelsDto,
  ) {
    return this.hotelService.searchHotels(companyId, criteria);
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Create a hotel booking for a customer' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async book(
    @CurrentCompany() companyId: string,
    @Body() body: CreateHotelBookingDto,
  ) {
    return this.hotelService.createBooking(companyId, body);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Get hotel booking details' })
  @ApiHeader({ name: 'x-company-id', required: true })
  @ApiParam({ name: 'id', description: 'Hotel booking ID' })
  async getBooking(
    @CurrentCompany() companyId: string,
    @Param('id') bookingId: string,
  ) {
    return this.hotelService.getBooking(companyId, bookingId);
  }

  @Patch('bookings/:id')
  @ApiOperation({ summary: 'Modify dates, room, or guests' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async updateBooking(
    @CurrentCompany() companyId: string,
    @Param('id') bookingId: string,
    @Body() body: UpdateHotelBookingDto,
  ) {
    return this.hotelService.updateBooking(companyId, bookingId, body);
  }

  @Post('bookings/:id/cancel')
  @ApiOperation({ summary: 'Cancel a hotel booking' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async cancelBooking(
    @CurrentCompany() companyId: string,
    @Param('id') bookingId: string,
    @Body() body: CancelHotelBookingDto,
  ) {
    return this.hotelService.cancelBooking(companyId, bookingId, body.reason);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get hotel operations dashboard' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getDashboard(@CurrentCompany() companyId: string) {
    return this.hotelService.getDashboard(companyId);
  }
}
