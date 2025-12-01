import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { WorkoutsModule } from '../workouts/workouts.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [WorkoutsModule, GamificationModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
