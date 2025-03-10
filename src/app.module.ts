import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactsModule } from './contacts/contacts.module';
import { EmailsModule } from './emails/emails.module';
import { InterestedUsersModule } from './interested-users/interested-users.module';
import { OutreachTeamModule } from './outreach-team/outreach-team.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ContactsModule,
    EmailsModule,
    InterestedUsersModule,
    OutreachTeamModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
