import { Module } from '@nestjs/common';
import { OutreachTeamController } from './outreach-team.controller';
import { OutreachTeamService } from './outreach-team.service';

@Module({
  controllers: [OutreachTeamController],
  providers: [OutreachTeamService],
  exports: [OutreachTeamService],
})
export class OutreachTeamModule {}
