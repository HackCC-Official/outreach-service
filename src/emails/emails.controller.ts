import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { SendEmailDto, SendBatchEmailsDto, UpdateEmailDto } from './emails.dto';
import { Email } from './emails.entity';

@ApiTags('Emails')
@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  /**
   * Send a single email
   * @param sendEmailDto The email data to send
   * @returns The sent email data
   */
  @ApiOperation({ summary: 'Send a single email' })
  @ApiResponse({
    status: 201,
    description: 'Email sent successfully',
    type: Email,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @Post('send')
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<Email> {
    return this.emailsService.sendEmail(sendEmailDto);
  }

  /**
   * Send multiple emails in batch
   * @param sendBatchEmailsDto The batch of emails to send
   * @returns Array of sent email data
   */
  @ApiOperation({ summary: 'Send multiple emails in batch' })
  @ApiResponse({
    status: 201,
    description: 'Batch emails sent successfully',
    type: [Email],
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
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
  @ApiOperation({ summary: 'Get all sent emails' })
  @ApiResponse({
    status: 200,
    description: 'List of all emails',
    type: [Email],
  })
  @Get()
  getAllEmails(): Email[] {
    return this.emailsService.getAllEmails();
  }

  /**
   * Get a specific email by ID
   * @param id The email ID
   * @returns The email data
   */
  @ApiOperation({ summary: 'Get a specific email by ID' })
  @ApiParam({
    name: 'id',
    description: 'Email unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Email found',
    type: Email,
  })
  @ApiResponse({ status: 404, description: 'Email not found' })
  @Get(':id')
  getEmailById(@Param('id') id: string): Email {
    return this.emailsService.getEmailById(id);
  }

  /**
   * Update an existing email
   * @param updateEmailDto The update data
   * @returns The updated email data
   */
  @ApiOperation({ summary: 'Update an existing email' })
  @ApiResponse({
    status: 200,
    description: 'Email updated successfully',
    type: Email,
  })
  @ApiResponse({ status: 404, description: 'Email not found' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @Put('update')
  updateEmail(@Body() updateEmailDto: UpdateEmailDto): Email {
    return this.emailsService.updateEmail(updateEmailDto);
  }
}
