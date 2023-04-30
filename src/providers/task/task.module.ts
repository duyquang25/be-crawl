import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { CommonModule } from 'src/common-service/common.module';

@Module({
  imports: [CommonModule],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
