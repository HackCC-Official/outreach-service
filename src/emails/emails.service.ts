import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  SendEmailDto,
  SendBatchEmailsDto,
  UpdateEmailDto,
  EmailAttachment,
} from './emails.dto';
import { Email } from './emails.entity';

interface ResendResponse {
  data: { id: string } | null;
  error: Error | null;
}

interface ResendBatchItem {
  from: string;
  to: string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

@Injectable()
export class EmailsService {
  private readonly resend: Resend;
  private readonly emailStore: Map<string, Email> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.get<string>(
        process.env.NODE_ENV === 'production'
          ? 'PROD_RESEND_API_KEY'
          : 'DEV_RESEND_API_KEY',
      ),
    );
  }

  /**
   * Sends a   single email using Resend
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
    try {
      const startTime = Date.now();
      const batchSize = sendBatchEmailsDto.emails.length;
      console.log(`Starting batch email operation with ${batchSize} emails`);

      // Optimize payload preparation
      const batchPayload: ResendBatchItem[] = sendBatchEmailsDto.emails.map(
        (emailDto) => ({
          from: emailDto.from,
          to: emailDto.to.map((recipient) => recipient.email),
          subject: emailDto.subject,
          html: emailDto.html,
          ...(emailDto.attachments && { attachments: emailDto.attachments }),
        }),
      );

      // Check batch size and split if necessary
      const MAX_BATCH_SIZE = 20; // Reduced from 25 to 20 for better reliability
      const batches: ResendBatchItem[][] = [];

      for (let i = 0; i < batchPayload.length; i += MAX_BATCH_SIZE) {
        batches.push(batchPayload.slice(i, i + MAX_BATCH_SIZE));
      }

      console.log(
        `Split into ${batches.length} sub-batches of max ${MAX_BATCH_SIZE} emails each`,
      );

      const sentEmails: Email[] = [];
      let failedBatches = 0;

      // Process each batch with retries
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const MAX_RETRIES = 2;
        let retryCount = 0;
        let success = false;

        while (!success && retryCount <= MAX_RETRIES) {
          try {
            console.log(
              `Processing batch ${batchIndex + 1}/${batches.length} (attempt ${retryCount + 1})`,
            );
            const batchStartTime = Date.now();

            const response = await this.resend.batch.send(batch);

            if (!response || response.error) {
              const errorMessage =
                response?.error?.message ?? 'Failed to send batch emails';
              console.error(`Batch ${batchIndex + 1} error: ${errorMessage}`);
              throw new Error(errorMessage);
            }

            // Map the responses to Email entities
            const batchEmails: Email[] = batch.map((email, index) => ({
              id: `batch-${sentEmails.length + index}-${Date.now()}`,
              from: email.from,
              to: email.to,
              subject: email.subject,
              html: email.html,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'delivered',
            }));

            // Store emails and add to result array
            batchEmails.forEach((email) => {
              this.emailStore.set(email.id, email);
              sentEmails.push(email);
            });

            const batchDuration = Date.now() - batchStartTime;
            console.log(
              `Batch ${batchIndex + 1} completed successfully in ${batchDuration}ms`,
            );
            success = true;
          } catch (error) {
            retryCount++;
            console.error(
              `Batch ${batchIndex + 1} failed (attempt ${retryCount}/${MAX_RETRIES + 1}):`,
              error instanceof Error ? error.message : 'Unknown error',
            );

            if (retryCount <= MAX_RETRIES) {
              const delay = 2000 * retryCount; // Exponential backoff
              console.log(`Retrying batch ${batchIndex + 1} in ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
              failedBatches++;
              console.error(
                `Batch ${batchIndex + 1} failed after ${MAX_RETRIES + 1} attempts, moving to next batch`,
              );
            }
          }
        }

        // Add a small delay between batches to avoid rate limiting
        if (batchIndex < batches.length - 1) {
          const delay = batches.length > 5 ? 2000 : 1000; // Longer delays for larger total batches
          console.log(`Waiting ${delay}ms before processing next batch...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      const totalDuration = Date.now() - startTime;
      console.log(
        `Batch email operation completed in ${totalDuration}ms. ${sentEmails.length} sent, ${failedBatches} batches failed.`,
      );

      if (failedBatches > 0) {
        console.warn(
          `Note: ${failedBatches} out of ${batches.length} batches failed to send.`,
        );
      }

      return sentEmails;
    } catch (error: unknown) {
      console.error(
        'Email batch sending failed completely:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw new InternalServerErrorException(
        `Failed to send batch emails: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
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
