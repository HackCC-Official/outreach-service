import { Module } from '@nestjs/common';
import { InterestedUsersController } from './interested-users.controller';
import { InterestedUsersService } from './interested-users.service';

/**
 * Module for handling interested users functionality
 */
@Module({
  controllers: [InterestedUsersController],
  providers: [InterestedUsersService],
})
export class InterestedUsersModule {}
