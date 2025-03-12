import { Injectable, Logger } from '@nestjs/common';
import { OutreachTeam } from './outreach-team.entity';
import {
  CreateOutreachTeamDto,
  UpdateOutreachTeamDto,
} from './outreach-team.dto';
import {
  DuplicateContactException,
  InvalidContactDataException,
} from '../contacts/contacts.exceptions';
import { SupabaseService } from '../auth/supabase.service';
import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';

@Injectable()
export class OutreachTeamService {
  private readonly TABLE_NAME = 'outreach_hackcc';
  private readonly logger = new Logger(OutreachTeamService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Normalizes an email address by trimming whitespace and converting to lower case.
   * @param email - The email address to normalize.
   * @returns The normalized email.
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Checks for duplicate email in the OutreachTeam table.
   * If a duplicate is found, it throws a DuplicateContactException.
   * @param email - The email to check.
   * @param excludeId - (Optional) The ID to exclude from the check (useful during updates).
   */
  private async checkDuplicateEmail(
    email: string,
    excludeId?: number,
  ): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const query = supabase
      .from(this.TABLE_NAME)
      .select('id')
      .eq('email', this.normalizeEmail(email));
    if (excludeId !== undefined) {
      query.neq('id', excludeId);
    }
    const { data }: PostgrestSingleResponse<{ id: number }> =
      await query.single();
    if (data) {
      throw new DuplicateContactException(email);
    }
  }

  /**
   * Create a new team member
   * @param createOutreachTeamDto - The team member data to create
   * @returns The created team member
   */
  async create(
    createOutreachTeamDto: CreateOutreachTeamDto,
  ): Promise<OutreachTeam> {
    const supabase = this.supabaseService.getClient();
    this.logger.debug(
      `Creating team member using environment: ${this.supabaseService.getCurrentEnvironment()}`,
    );

    // Check for duplicate email
    await this.checkDuplicateEmail(createOutreachTeamDto.email);

    const { data, error }: PostgrestSingleResponse<OutreachTeam> =
      await supabase
        .from(this.TABLE_NAME)
        .insert([
          {
            ...createOutreachTeamDto,
            email: this.normalizeEmail(createOutreachTeamDto.email),
          },
        ])
        .select()
        .single();

    if (error) {
      throw new InvalidContactDataException([error.message]);
    }

    return data;
  }

  /**
   * Find all team members with optional pagination
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Array of team members and total count
   */
  async findAll(skip = 0, take = 10): Promise<[OutreachTeam[], number]> {
    const supabase = this.supabaseService.getClient();

    const { data, error, count }: PostgrestResponse<OutreachTeam> =
      await supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact' })
        .range(skip, skip + take - 1);

    if (error) {
      throw new InvalidContactDataException([error.message]);
    }

    return [data || [], count || 0];
  }

  /**
   * Find a team member by ID
   * @param id - The team member ID
   * @returns The found team member
   */
  async findOne(id: number): Promise<OutreachTeam> {
    const supabase = this.supabaseService.getClient();

    const { data, error }: PostgrestSingleResponse<OutreachTeam> =
      await supabase.from(this.TABLE_NAME).select('*').eq('id', id).single();

    if (error || !data) {
      throw new InvalidContactDataException([
        `Team member with id ${id} not found`,
      ]);
    }

    return data;
  }

  /**
   * Update a team member by ID
   * @param id - The team member ID
   * @param updateOutreachTeamDto - The team member data to update
   * @returns The updated team member
   */
  async update(
    id: number,
    updateOutreachTeamDto: UpdateOutreachTeamDto,
  ): Promise<OutreachTeam> {
    const supabase = this.supabaseService.getClient();

    // If email is being updated, check for duplicates
    if (updateOutreachTeamDto.email !== undefined) {
      await this.checkDuplicateEmail(updateOutreachTeamDto.email, id);
    }

    // Build update data object, normalizing email if provided
    const updateData: Partial<OutreachTeam> = {
      ...updateOutreachTeamDto,
    };
    if (updateOutreachTeamDto.email !== undefined) {
      updateData.email = this.normalizeEmail(updateOutreachTeamDto.email);
    }

    const { data, error }: PostgrestSingleResponse<OutreachTeam> =
      await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error || !data) {
      throw new InvalidContactDataException([
        error?.message || 'Failed to update team member',
      ]);
    }

    return data;
  }

  /**
   * Delete a team member by ID
   * @param id - The team member ID
   * @returns void
   */
  async remove(id: number): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Check if team member exists
    await this.findOne(id);

    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      throw new InvalidContactDataException(['Failed to delete team member']);
    }
  }
}
