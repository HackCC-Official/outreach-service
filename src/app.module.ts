import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactsModule } from './contacts/contacts.module';
import { EmailsModule } from './emails/emails.module';

@Module({
  imports: [ContactsModule, EmailsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
