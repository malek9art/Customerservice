import { Module, OnModuleInit } from '@nestjs/common';
import { HotelBookingService } from './hotel-booking.service';
import { HotelController } from './hotel.controller';
import { HotelProviderRegistry } from './providers/hotel-provider.registry';
import { MockHotelProvider } from './providers/mock-hotel.provider';

@Module({
  controllers: [HotelController],
  providers: [HotelBookingService, HotelProviderRegistry, MockHotelProvider],
  exports: [HotelBookingService],
})
export class HotelModule implements OnModuleInit {
  constructor(
    private registry: HotelProviderRegistry,
    private mockProvider: MockHotelProvider,
  ) {}

  onModuleInit() {
    this.registry.register(this.mockProvider);
  }
}
