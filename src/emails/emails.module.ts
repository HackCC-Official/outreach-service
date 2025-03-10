import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';

@Module({
  imports: [ConfigModule],
  providers: [EmailsService],
  controllers: [EmailsController],
  exports: [EmailsService],
})
export class EmailsModule {}
