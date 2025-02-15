import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SendEmailDto, SendBatchEmailsDto, UpdateEmailDto } from './emails.dto';
import { Email } from './emails.entity';

interface ResendResponse {
  data: { id: string } | null;
  error: Error | null;
}

@Injectable()
export class EmailsService {
  private readonly resend: Resend;
  private readonly emailStore: Map<string, Email> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  /**
   * Sends a single email using Resend
   * @param sendEmailDto The email data to send
   * @returns The sent email data
   */
  async sendEmail(sendEmailDto: SendEmailDto): Promise<Email> {
    try {
      const { data, error }: ResendResponse = await this.resend.emails.send({
        from: sendEmailDto.from,
        to: sendEmailDto.to.map((recipient) => recipient.email),
        subject: sendEmailDto.subject,
        html: sendEmailDto.html,
        attachments: sendEmailDto.attachments,
      });

      if (error || !data) {
        throw new Error(error?.message ?? 'Failed to send email');
      }

      const email: Email = {
        id: data.id,
        from: sendEmailDto.from,
        to: sendEmailDto.to.map((r) => r.email),
        subject: sendEmailDto.subject,
        html: sendEmailDto.html,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'delivered',
      };

      this.emailStore.set(email.id, email);
      return email;
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Sends multiple emails in batch
   * @param sendBatchEmailsDto The batch of emails to send
   * @returns Array of sent email data
   */
  async sendBatchEmails(
    sendBatchEmailsDto: SendBatchEmailsDto,
  ): Promise<Email[]> {
    const sentEmails: Email[] = [];

    for (const emailDto of sendBatchEmailsDto.emails) {
      try {
        const sentEmail = await this.sendEmail(emailDto);
        sentEmails.push(sentEmail);
      } catch (error: unknown) {
        console.error(
          `Failed to send email to ${emailDto.to.map((r) => r.email).join(', ')}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return sentEmails;
  }

  /**
   * Retrieves an email by its ID
   * @param id The email ID
   * @returns The email data
   */
  getEmailById(id: string): Email {
    const email = this.emailStore.get(id);
    if (!email) {
      throw new NotFoundException(`Email with ID ${id} not found`);
    }
    return email;
  }

  /**
   * Updates an existing email
   * @param updateEmailDto The update data
   * @returns The updated email data
   */
  updateEmail(updateEmailDto: UpdateEmailDto): Email {
    const email = this.getEmailById(updateEmailDto.id);

    const updatedEmail: Email = {
      ...email,
      ...(updateEmailDto.subject && { subject: updateEmailDto.subject }),
      ...(updateEmailDto.html && { html: updateEmailDto.html }),
      updatedAt: new Date(),
    };

    this.emailStore.set(email.id, updatedEmail);
    return updatedEmail;
  }

  /**
   * Retrieves all sent emails
   * @returns Array of all emails
   */
  getAllEmails(): Email[] {
    return Array.from(this.emailStore.values());
  }
}
