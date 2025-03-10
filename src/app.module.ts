import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactsModule } from './contacts/contacts.module';
import { EmailsModule } from './emails/emails.module';
import { InterestedUsersModule } from './interested-users/interested-users.module';
import { OutreachTeamModule } from './outreach-team/outreach-team.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ContactsModule,
    EmailsModule,
    InterestedUsersModule,
    OutreachTeamModule,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // time-to-live (in milliseconds) - 1 minute
        limit: 5, // limit of requests within ttl
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
