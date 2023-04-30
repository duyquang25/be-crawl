import { Injectable, Logger } from '@nestjs/common';
import { CommonService } from './common-service/common.service';
import { QueryDTO } from './common/query.dto';
import { KEY_REDIS } from './common/enum/key-redis.enum';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly commonService: CommonService) {}

  async getProfitLog(query: QueryDTO) {
    const { offset = 0, limit = 10 } = query;

    const max = -1 - offset;
    const min = offset - limit;

    const logs = await this.commonService.zRangeSortSet(min, max);
    const [
      rateBidBTCUSDT,
      rateAskBTCUSDT,
      rateBidETHBTC,
      rateAskETHBTC,
      rateBidETHUSDT,
      rateAskETHUSDT,
    ] = await Promise.all([
      this.commonService.getCache(KEY_REDIS.BestBidBTCUSDT),
      this.commonService.getCache(KEY_REDIS.BestAskBTCUSDT),
      this.commonService.getCache(KEY_REDIS.BestBidETHBTC),
      this.commonService.getCache(KEY_REDIS.BestAskETHBTC),
      this.commonService.getCache(KEY_REDIS.BestBidETHUSDT),
      this.commonService.getCache(KEY_REDIS.BestAskETHUSDT),
    ]);

    return {
      logs: logs.reverse(),
      rateBidBTCUSDT,
      rateAskBTCUSDT,
      rateBidETHBTC,
      rateAskETHBTC,
      rateBidETHUSDT,
      rateAskETHUSDT,
    };
  }
}
