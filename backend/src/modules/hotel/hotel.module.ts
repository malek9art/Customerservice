import { Module, OnModuleInit } from '@nestjs/common';
import { HotelBookingService } from './hotel-booking.service';
import { HotelController } from './hotel.controller';
import { HotelProviderRegistry } from './providers/hotel-provider.registry';
import { StatefulHotelProvider } from './providers/stateful-hotel.provider';

@Module({
  controllers: [HotelController],
  providers: [
    HotelBookingService,
    HotelProviderRegistry,
    StatefulHotelProvider,
  ],
  exports: [HotelBookingService],
})
export class HotelModule implements OnModuleInit {
  constructor(
    private registry: HotelProviderRegistry,
    private hotelProvider: StatefulHotelProvider,
  ) {}

  onModuleInit() {
    this.registry.register(this.hotelProvider);
  }
}
