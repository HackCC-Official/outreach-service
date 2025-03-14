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
import { SupabaseService } from '../auth/supabase.service';
import { CreateInterestedUserDto } from './dto/create-interested-user.dto';
import { EmailsService } from '../emails/emails.service';
import { SendEmailDto } from '../emails/emails.dto';
import { renderThankYouEmail } from '../emails/render-emails';

@Injectable()
export class InterestedUsersService {
  private readonly TABLE_NAME = 'interested_users';
  private readonly logger = new Logger(InterestedUsersService.name);

  constructor(
    private readonly emailsService: EmailsService,
    private readonly supabaseService: SupabaseService,
  ) {}

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
    const supabase = this.supabaseService.getClient();
    this.logger.debug(
      `Using Supabase client for environment: ${this.supabaseService.getCurrentEnvironment()}`,
    );

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
      const emailHtml = await renderThankYouEmail({
        recipientEmail,
      });

      const emailDto: SendEmailDto = {
        from: 'support@hackcc.net',
        to: [{ email: recipientEmail }],
        subject: 'Thank you for your interest in HackCC!',
        html: emailHtml,
      };

      await this.emailsService.sendEmail(emailDto);
      this.logger.log(`Thank you email sent to ${recipientEmail}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send thank you email: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Retrieves all interested users
   * @returns Array of interested users
   */
  public async findAll(): Promise<InterestedUser[]> {
    const supabase = this.supabaseService.getClient();

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
    const supabase = this.supabaseService.getClient();

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
   * Deletes an interested user by email
   * @param email - The email of the interested user to delete
   * @throws NotFoundException if the user doesn't exist
   */
  public async remove(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const supabase = this.supabaseService.getClient();
    this.logger.debug(
      `Removing user with email ${normalizedEmail} using environment: ${this.supabaseService.getCurrentEnvironment()}`,
    );

    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('email', normalizedEmail);

    if (error) {
      throw new NotFoundException('Failed to delete interested user');
    }
  }
}
