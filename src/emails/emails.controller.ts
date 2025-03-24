import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { SendEmailDto, SendBatchEmailsDto, UpdateEmailDto } from './emails.dto';
import { Email } from './emails.entity';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AccountRoles } from '../auth/role.enum';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
  @Post('send')
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<Email> {
    return this.emailsService.sendEmail(sendEmailDto);
  }

  /**
   * Send multiple emails in batch
   * @param sendBatchEmailsDto The batch of emails to send
   * @returns Array of sent email data
   */
  @ApiOperation({
    summary: 'Send multiple emails in batch',
    description: `Sends multiple emails in a single batch operation using Resend's batch API.
    Each email in the batch is processed separately but in a single API call, 
    improving performance for bulk email sending.
    Note: This endpoint supports payloads up to 50MB. For larger batches, 
    consider splitting them into multiple requests of 20-25 emails per batch.`,
  })
  @ApiBody({
    type: SendBatchEmailsDto,
    description: 'Batch of emails to send',
    examples: {
      batchEmail: {
        summary: 'Basic batch email example',
        description: 'A batch of two simple emails',
        value: {
          emails: [
            {
              from: 'Company <notifications@example.com>',
              to: [{ email: 'recipient1@example.com' }],
              subject: 'First Email Subject',
              html: '<h1>Hello</h1><p>This is the first email content.</p>',
            },
            {
              from: 'Company <notifications@example.com>',
              to: [{ email: 'recipient2@example.com' }],
              subject: 'Second Email Subject',
              html: '<h1>Hello</h1><p>This is the second email content.</p>',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Batch emails sent successfully',
    type: [Email],
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({
    status: 413,
    description: 'Request entity too large - try reducing batch size',
  })
  @ApiResponse({ status: 500, description: 'Failed to send batch emails' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
  @Post('send-batch')
  async sendBatchEmails(
    @Body() sendBatchEmailsDto: SendBatchEmailsDto,
  ): Promise<Email[]> {
    // Verify batch size is reasonable
    if (sendBatchEmailsDto.emails.length > 50) {
      throw new PayloadTooLargeException(
        'Batch size too large. Please limit to 50 emails per request.',
      );
    }
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([AccountRoles.ADMIN, AccountRoles.ORGANIZER])
  @Put('update')
  updateEmail(@Body() updateEmailDto: UpdateEmailDto): Email {
    return this.emailsService.updateEmail(updateEmailDto);
  }
}
