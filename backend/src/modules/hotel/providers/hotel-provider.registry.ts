import { BadRequestException, Injectable } from '@nestjs/common';
import { IHotelProvider } from '../interfaces/hotel-provider.interface';

@Injectable()
export class HotelProviderRegistry {
  private providers = new Map<string, IHotelProvider>();

  register(provider: IHotelProvider) {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): IHotelProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(`Hotel provider ${name} not found`);
    }
    return provider;
  }

  getAllProviders(): IHotelProvider[] {
    return Array.from(this.providers.values());
  }
}
