import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InterestedUser } from './interested-user.entity';
import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';
import { supabase } from '../config/supabase.config';
import { CreateInterestedUserDto } from './dto/create-interested-user.dto';
import { EmailsService } from '../emails/emails.service';
import { SendEmailDto } from '../emails/emails.dto';
import { renderThankYouEmail } from '../emails/render-emails';

/**
 * Service handling interested users operations
 */
@Injectable()
export class InterestedUsersService {
  private readonly TABLE_NAME = 'interested_users';
  private readonly logger = new Logger(InterestedUsersService.name);

  constructor(private readonly emailsService: EmailsService) {}

  /**
   * Extracts the data from a single Supabase response or throws an exception if there's an error.
   * @param result - The result from a Supabase query.
   * @param fallbackMessage - Fallback error message.
   * @returns The data from the result.
   */
  private extractSingleResult<T>(
    result: PostgrestSingleResponse<T>,
    fallbackMessage: string,
  ): T {
    if (result.error || !result.data) {
      throw new NotFoundException(result.error?.message || fallbackMessage);
    }
    return result.data;
  }

  /**
   * Normalizes an email address by trimming whitespace and converting to lower case.
   * @param email - The email address to normalize.
   * @returns The normalized email.
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Creates a new interested user
   * @param createInterestedUserDto - The data for creating a new interested user
   * @returns The created interested user
   * @throws ConflictException if the email already exists
   */
  public async create(
    createInterestedUserDto: CreateInterestedUserDto,
  ): Promise<InterestedUser> {
    const normalizedEmail = this.normalizeEmail(createInterestedUserDto.email);

    // Check for existing email
    const { data: existingUser } = await supabase
      .from(this.TABLE_NAME)
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const createResult: PostgrestSingleResponse<InterestedUser> = await supabase
      .from(this.TABLE_NAME)
      .insert([
        {
          email: normalizedEmail,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    const createdUser = this.extractSingleResult(
      createResult,
      'Failed to create interested user',
    );

    // Send thank you email asynchronously (don't await)
    this.sendThankYouEmail(normalizedEmail).catch((error: Error) => {
      // Log error but don't block the response
      this.logger.error(`Failed to send thank you email: ${error.message}`);
    });

    return createdUser;
  }

  /**
   * Sends a thank you email to the user
   * @param recipientEmail - The email address of the user
   */
  private async sendThankYouEmail(recipientEmail: string): Promise<void> {
    try {
      // Render the thank you email HTML
      const emailHtml = await renderThankYouEmail({
        recipientEmail,
      });

      // Create the email DTO
      const emailDto: SendEmailDto = {
        from: 'tiffanyn@hackcc.net',
        to: [{ email: recipientEmail }],
        subject: 'Thank you for your interest in HackCC!',
        html: emailHtml,
      };

      // Send the email
      await this.emailsService.sendEmail(emailDto);
      this.logger.log(`Thank you email sent to ${recipientEmail}`);
    } catch (error) {
      // Just log the error but don't show to user as the interest registration was successful
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send thank you email: ${errorMessage}`);
      throw error; // Rethrow to let the caller handle it
    }
  }

  /**
   * Retrieves all interested users
   * @returns Array of interested users
   */
  public async findAll(): Promise<InterestedUser[]> {
    const { data, error }: PostgrestResponse<InterestedUser> = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data || [];
  }

  /**
   * Retrieves a specific interested user by ID
   * @param id - The UUID of the interested user
   * @returns The interested user if found
   * @throws NotFoundException if the user doesn't exist
   */
  public async findOne(id: string): Promise<InterestedUser> {
    const findResult: PostgrestSingleResponse<InterestedUser> = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    return this.extractSingleResult(
      findResult,
      `Interested user with id ${id} not found`,
    );
  }

  /**
   * Deletes an interested user by ID
   * @param id - The UUID of the interested user to delete
   * @throws NotFoundException if the user doesn't exist
   */
  public async remove(id: string): Promise<void> {
    // Check if user exists first
    await this.findOne(id);

    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      throw new NotFoundException('Failed to delete interested user');
    }
  }
}
