import { Module } from '@nestjs/common';
import { InterestedUsersController } from './interested-users.controller';
import { InterestedUsersService } from './interested-users.service';
import { InterestedUsersThrottlerGuard } from './throttler.guard';
import { EmailsModule } from '../emails/emails.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EmailsModule, AuthModule],
  controllers: [InterestedUsersController],
  providers: [InterestedUsersService, InterestedUsersThrottlerGuard],
})
export class InterestedUsersModule {}
