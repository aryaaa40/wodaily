import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { CaptureModule } from './capture/capture.module';
import { LearningModule } from './learning/learning.module';

@Module({
  imports: [PrismaModule, TasksModule, CaptureModule, LearningModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
