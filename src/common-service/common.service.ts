import { Inject, Injectable, Logger } from '@nestjs/common';
import { KEY_REDIS } from 'src/common/enum/key-redis.enum';
import Redis from 'ioredis';
import { TOTAL_LOG_KEEP } from 'src/common/constants';

@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name);

  constructor(@Inject('REDIS') private readonly client: Redis) {}

  setCache(key: string, data: any) {
    try {
      this.client.set(key, data);
    } catch (error) {
      this.logger.error(error);
    }
  }

  getCache(key: string) {
    return this.client.get(key) as any;
  }

  async delCache(key: string) {
    return (await this.client.del(key)) as any;
  }

  async zAddSortSet(value: string, score: number) {
    await this.client.zadd(KEY_REDIS.PROFIT, score, value);
  }

  async zRangeSortSet(min: number, max: number) {
    return this.client.zrange(KEY_REDIS.PROFIT, min, max);
  }

  async zDeleteSorSet() {
    const total = await this.client.zcard(KEY_REDIS.PROFIT);
    if (total < TOTAL_LOG_KEEP) return;
    this.logger.debug(`Starting remove members in sortset:: ${total - TOTAL_LOG_KEEP} members`);
    return this.client.zremrangebyrank(KEY_REDIS.PROFIT, 0, total - TOTAL_LOG_KEEP - 1);
  }
}
