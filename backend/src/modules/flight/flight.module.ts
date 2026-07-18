import { Module, OnModuleInit } from '@nestjs/common';
import { FlightBookingService } from './flight-booking.service';
import { FlightController } from './flight.controller';
import { FlightProviderRegistry } from './providers/flight-provider.registry';
import { MockAmadeusProvider } from './providers/mock-amadeus.provider';

@Module({
  controllers: [FlightController],
  providers: [
    FlightBookingService,
    FlightProviderRegistry,
    MockAmadeusProvider,
  ],
  exports: [FlightBookingService],
})
export class FlightModule implements OnModuleInit {
  constructor(
    private registry: FlightProviderRegistry,
    private amadeus: MockAmadeusProvider,
  ) {}

  onModuleInit() {
    this.registry.register(this.amadeus);
  }
}
