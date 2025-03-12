import { Module } from '@nestjs/common';
import { OutreachTeamController } from './outreach-team.controller';
import { OutreachTeamService } from './outreach-team.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OutreachTeamController],
  providers: [OutreachTeamService],
  exports: [OutreachTeamService],
})
export class OutreachTeamModule {}
