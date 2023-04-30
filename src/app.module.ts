import { Module, Scope } from '@nestjs/common';
import { AppController } from './app.controller';
import { CrawlerService } from './crawler.service';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionFilter } from './common/exception/exception.filter';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './providers/task/task.module';
import { CommonModule } from './common-service/common.module';
import { SocketGateway } from './providers/socket/socket.gateway';
import { AppService } from './app.service';

@Module({
  imports: [CommonModule, ScheduleModule.forRoot(), TaskModule],
  controllers: [AppController],
  providers: [
    AppService,
    CrawlerService,
    {
      provide: APP_FILTER,
      scope: Scope.REQUEST,
      useClass: AllExceptionFilter,
    },
    SocketGateway,
  ],
  exports: [CrawlerService],
})
export class AppModule {}
