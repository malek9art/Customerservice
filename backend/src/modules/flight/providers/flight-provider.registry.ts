import { Injectable } from '@nestjs/common';
import { IFlightProvider } from '../interfaces/flight-provider.interface';

@Injectable()
export class FlightProviderRegistry {
  private providers = new Map<string, IFlightProvider>();

  register(provider: IFlightProvider) {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): IFlightProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Flight provider ${name} not found`);
    }
    return provider;
  }

  getAllProviders(): IFlightProvider[] {
    return Array.from(this.providers.values());
  }
}
