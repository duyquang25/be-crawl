import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import Redis from 'ioredis';

@Module({
  imports: [],
  providers: [
    {
      provide: 'REDIS',
      useFactory: async () => {
        const client = new Redis({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        });
        return client;
      },
    },
    CommonService,
  ],
  exports: [CommonService],
})
export class CommonModule {}
