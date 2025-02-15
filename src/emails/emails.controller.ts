import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SendEmailDto, SendBatchEmailsDto, UpdateEmailDto } from './emails.dto';
import { Email } from './emails.entity';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  /**
   * Send a single email
   * @param sendEmailDto The email data to send
   * @returns The sent email data
   */
  @Post('send')
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<Email> {
    return this.emailsService.sendEmail(sendEmailDto);
  }

  /**
   * Send multiple emails in batch
   * @param sendBatchEmailsDto The batch of emails to send
   * @returns Array of sent email data
   */
  @Post('send-batch')
  async sendBatchEmails(
    @Body() sendBatchEmailsDto: SendBatchEmailsDto,
  ): Promise<Email[]> {
    return this.emailsService.sendBatchEmails(sendBatchEmailsDto);
  }

  /**
   * Get all sent emails
   * @returns Array of all emails
   */
  @Get()
  getAllEmails(): Email[] {
    return this.emailsService.getAllEmails();
  }

  /**
   * Get a specific email by ID
   * @param id The email ID
   * @returns The email data
   */
  @Get(':id')
  getEmailById(@Param('id') id: string): Email {
    return this.emailsService.getEmailById(id);
  }

  /**
   * Update an existing email
   * @param updateEmailDto The update data
   * @returns The updated email data
   */
  @Put('update')
  updateEmail(@Body() updateEmailDto: UpdateEmailDto): Email {
    return this.emailsService.updateEmail(updateEmailDto);
  }
}
