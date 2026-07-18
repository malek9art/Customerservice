import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { HotelBookingService } from './hotel-booking.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Hotel Operations')
@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelBookingService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search hotels across multiple providers' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async search(@CurrentCompany() companyId: string, @Body() criteria: any) {
    return this.hotelService.searchHotels(companyId, criteria);
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Create a hotel booking' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async book(@CurrentCompany() companyId: string, @Body() body: any) {
    return this.hotelService.createBooking(
      companyId,
      body.customerId,
      body.provider,
      body.offerId,
      body.guests,
    );
  }
}
