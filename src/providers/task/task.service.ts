import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CommonService } from 'src/common-service/common.service';
import { KEY_REDIS } from 'src/common/enum/key-redis.enum';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  constructor(private readonly commonService: CommonService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async removeOldLogs() {
    await this.commonService.zDeleteSorSet();
  }
}
