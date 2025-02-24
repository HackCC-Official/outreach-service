import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InterestedUser } from './interested-user.entity';
import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';
import { supabase } from '../config/supabase.config';
import { CreateInterestedUserDto } from './dto/create-interested-user.dto';

/**
 * Service handling interested users operations
 */
@Injectable()
export class InterestedUsersService {
  private readonly TABLE_NAME = 'interested_users';

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

    return this.extractSingleResult(
      createResult,
      'Failed to create interested user',
    );
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
