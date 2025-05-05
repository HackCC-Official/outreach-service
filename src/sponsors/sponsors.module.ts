import { Module } from '@nestjs/common';
import { EmailsModule } from '../emails/emails.module';
import { SponsorsController } from './sponsors.controller';

@Module({
  imports: [EmailsModule],
  controllers: [SponsorsController],
})
export class SponsorsModule {}
