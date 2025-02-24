import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactsModule } from './contacts/contacts.module';
import { EmailsModule } from './emails/emails.module';
import { InterestedUsersModule } from './interested-users/interested-users.module';

@Module({
  imports: [ContactsModule, EmailsModule, InterestedUsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
