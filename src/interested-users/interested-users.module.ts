import { Module } from '@nestjs/common';
import { InterestedUsersController } from './interested-users.controller';
import { InterestedUsersService } from './interested-users.service';
import { InterestedUsersThrottlerGuard } from './throttler.guard';

/**
 * Module for handling interested users functionality
 */
@Module({
  controllers: [InterestedUsersController],
  providers: [InterestedUsersService, InterestedUsersThrottlerGuard],
})
export class InterestedUsersModule {}
