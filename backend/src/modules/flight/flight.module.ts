import { Module, OnModuleInit } from '@nestjs/common';
import { FlightBookingService } from './flight-booking.service';
import { FlightController } from './flight.controller';
import { FlightProviderRegistry } from './providers/flight-provider.registry';
import { AmadeusProvider } from './providers/amadeus.provider';
import { FareRulesEvaluatorService } from './fare-rules-evaluator.service';

@Module({
  controllers: [FlightController],
  providers: [
    FlightBookingService,
    FlightProviderRegistry,
    AmadeusProvider,
    FareRulesEvaluatorService,
  ],
  exports: [FlightBookingService, FareRulesEvaluatorService],
})
export class FlightModule implements OnModuleInit {
  constructor(
    private registry: FlightProviderRegistry,
    private amadeus: AmadeusProvider,
  ) {}

  onModuleInit() {
    this.registry.register(this.amadeus);
  }
}
