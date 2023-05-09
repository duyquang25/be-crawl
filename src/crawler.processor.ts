import { OnQueueActive, OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CrawlerService } from './crawler.service';

@Processor('crawl')
export class CrawlerProcessor {
  private readonly logger = new Logger(CrawlerProcessor.name);
  constructor(private readonly crawlerService: CrawlerService) {}

  @OnQueueActive()
  onActive(job: Job) {
    // this.logger.log(`Processor:@OnQueueActive - Processing job ${job.id} of type ${job.name}.`);
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    // this.logger.log(`Processor:@OnQueueCompleted - Completed job ${job.id} of type ${job.name}.`);
  }

  @OnQueueFailed()
  onError(job: Job<any>, error) {
    this.logger.log(
      `Processor:@OnQueueFailed - Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack
    );
  }

  @Process('crawl')
  async handle(): Promise<any> {
    // this.logger.log('Processor:@Process - handle job.');
    try {
      return await this.crawlerService.calculateArbitrage();
    } catch (error) {
      this.logger.error('Failed to job.', error.stack);
      throw error;
    }
  }
}
