import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { FlightBookingService } from './flight-booking.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Flight Operations')
@Controller('flights')
export class FlightController {
  constructor(private readonly flightService: FlightBookingService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search for flights across multiple GDS providers' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async search(@CurrentCompany() companyId: string, @Body() criteria: any) {
    return this.flightService.searchFlights(companyId, criteria);
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Create a flight booking (PNR)' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async createBooking(
    @CurrentCompany() companyId: string,
    @Body()
    body: {
      customerId: string;
      provider: string;
      offerId: string;
      passengers: any[];
    },
  ) {
    return this.flightService.createBooking(
      companyId,
      body.customerId,
      body.provider,
      body.offerId,
      body.passengers,
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Flight Operations Dashboard' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getDashboard(@CurrentCompany() companyId: string) {
    return this.flightService.getDashboard(companyId);
  }
}
