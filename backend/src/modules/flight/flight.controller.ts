import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiParam } from '@nestjs/swagger';
import { FlightBookingService } from './flight-booking.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { EvaluationRequest } from './fare-rules-evaluator.service';

@ApiTags('Flight Operations')
@Controller('flights')
export class FlightController {
  constructor(private readonly flightService: FlightBookingService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search for flights across live GDS provider adapters' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async search(@CurrentCompany() companyId: string, @Body() criteria: any) {
    return this.flightService.searchFlights(companyId, criteria);
  }

  @Post('fare-rules/evaluate')
  @ApiOperation({ summary: 'Evaluate flight fare rules and dynamic baggage/penalty policy via BRE' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async evaluateFareRules(
    @CurrentCompany() companyId: string,
    @Body() req: EvaluationRequest,
  ) {
    return this.flightService.evaluateFareRules(companyId, req);
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Create a live flight booking and PNR creation in GDS' })
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

  @Post('bookings/:id/issue-ticket')
  @ApiOperation({ summary: 'Issue live electronic tickets for a PNR' })
  @ApiHeader({ name: 'x-company-id', required: true })
  @ApiParam({ name: 'id', description: 'Flight Booking ID' })
  async issueTicket(
    @CurrentCompany() companyId: string,
    @Param('id') bookingId: string,
  ) {
    return this.flightService.issueTicket(companyId, bookingId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Flight Operations Dashboard' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getDashboard(@CurrentCompany() companyId: string) {
    return this.flightService.getDashboard(companyId);
  }
}
