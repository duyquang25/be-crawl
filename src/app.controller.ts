import { Controller, Get, Post, Query, Req } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { QueryDTO } from './common/query.dto';
import { AppService } from './app.service';
import { ApiSuccessResponse } from './common/response/api-success';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return 'Hello API!';
  }

  @Get('/profit-log')
  async getProfitLog(@Query() query: QueryDTO) {
    try {
      const response = await this.appService.getProfitLog(query);
      return new ApiSuccessResponse().success(response);
    } catch (error) {
      throw error;
    }
  }
}
