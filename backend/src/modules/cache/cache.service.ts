import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private redis: Redis;

  constructor(private config: ConfigService) {
    // In a real environment, we would connect to the actual Redis instance
    // this.redis = new Redis(this.config.get('REDIS_URL'));
    this.redis = {
      get: async (key: string) => null,
      set: async (key: string, val: string, mode?: string, duration?: number) =>
        'OK',
      del: async (key: string) => 1,
    } as any;
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
