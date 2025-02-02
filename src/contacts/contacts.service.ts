import { Injectable } from '@nestjs/common';
import { Contact } from './contacts.entity';
import { CreateContactDto, UpdateContactDto } from './contacts.dto';
import {
  DuplicateContactException,
  InvalidContactDataException,
} from './contacts.exceptions';
import { supabase } from '../config/supabase.config';
import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

@Injectable()
export class ContactsService {
  private readonly TABLE_NAME = 'Contacts';

  /**
   * Normalizes an email address by trimming whitespace and converting to lower case.
   * @param email - The email address to normalize.
   * @returns The normalized email.
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Checks for duplicate email in the Contacts table.
   * If a duplicate is found, it throws a DuplicateContactException.
   * @param email - The email to check.
   * @param excludeId - (Optional) The ID to exclude from the check (useful during updates).
   */
  private async checkDuplicateEmail(
    email: string,
    excludeId?: number,
  ): Promise<void> {
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
      throw new InvalidContactDataException([
        result.error?.message || fallbackMessage,
      ]);
    }
    return result.data;
  }

  /**
   * Create a new contact
   * @param createContactDto - The contact data to create
   * @returns The created contact
   */
  async create(createContactDto: CreateContactDto): Promise<Contact> {
    // Check for duplicate email using helper method
    await this.checkDuplicateEmail(createContactDto.email);

    const createResult: PostgrestSingleResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .insert([
        {
          ...createContactDto,
          email: this.normalizeEmail(createContactDto.email),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    return this.extractSingleResult(createResult, 'Failed to create contact');
  }

  /**
   * Find all contacts with optional pagination
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Array of contacts and total count
   */
  async findAll(skip = 0, take = 10): Promise<[Contact[], number]> {
    const { data, error, count }: PostgrestResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + take - 1);

    if (error) {
      throw new InvalidContactDataException([error.message]);
    }

    return [data || [], count || 0];
  }

  /**
   * Find a contact by ID
   * @param id - The contact ID
   * @returns The found contact or throws ContactNotFoundException
   */
  async findOne(id: number): Promise<Contact> {
    const findResult: PostgrestSingleResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    return this.extractSingleResult(
      findResult,
      `Contact with id ${id} not found`,
    );
  }

  /**
   * Update a contact by ID
   * @param id - The contact ID
   * @param updateContactDto - The contact data to update
   * @returns The updated contact
   */
  async update(
    id: number,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    // If email is being updated, check for duplicates using helper method
    if (updateContactDto.email !== undefined) {
      await this.checkDuplicateEmail(updateContactDto.email, id);
    }

    // Build update data object, normalizing email if provided.
    const updateData: Partial<Contact & { updated_at: string }> = {
      ...updateContactDto,
      updated_at: new Date().toISOString(),
    };
    if (updateContactDto.email !== undefined) {
      updateData.email = this.normalizeEmail(updateContactDto.email);
    }

    const updateResult: PostgrestSingleResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return this.extractSingleResult(updateResult, 'Failed to update contact');
  }

  /**
   * Delete a contact by ID
   * @param id - The contact ID
   * @returns void
   */
  async remove(id: number): Promise<void> {
    // Check if contact exists
    await this.findOne(id);

    const result = await supabase.from(this.TABLE_NAME).delete().eq('id', id);

    if ('error' in result && result.error !== null) {
      throw new InvalidContactDataException(['Failed to delete contact']);
    }
  }

  /**
   * Search contacts by name, email, or company
   * @param query - The search query
   * @returns Array of matching contacts
   */
  async search(query: string): Promise<Contact[]> {
    if (!query || query.trim().length === 0) {
      throw new InvalidContactDataException(['Search query cannot be empty']);
    }

    const searchQuery = `%${query.toLowerCase()}%`;
    const { data, error }: PostgrestResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .or(
        `name.ilike.${searchQuery},email.ilike.${searchQuery},company.ilike.${searchQuery}`,
      )
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      const errMsg: string =
        typeof error.message === 'string'
          ? error.message
          : 'Unknown error occurred';
      throw new InvalidContactDataException([errMsg]);
    }

    return data || [];
  }

  /**
   * Uploads contacts in bulk from a CSV file buffer.
   * Parses CSV rows and creates contacts for valid rows.
   * @param fileBuffer - The CSV file buffer uploaded by the user
   * @returns An object containing an array of successfully created contacts and an array of error messages for rows that failed
   */
  async uploadContacts(
    fileBuffer: Buffer,
  ): Promise<{ createdContacts: Contact[]; errors: string[] }> {
    interface ParsedContactRow {
      name: string;
      email: string;
      company: string;
      role: string;
      phone?: string;
      linkedin?: string;
      notes?: string;
    }

    let rows: ParsedContactRow[];
    try {
      rows = parse(fileBuffer, {
        columns: true,
        trim: true,
        skip_empty_lines: true,
      });
    } catch {
      throw new InvalidContactDataException(['Failed to parse CSV file']);
    }

    const createdContacts: Contact[] = [];
    const errors: string[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (!row.name || !row.email || !row.company || !row.role) {
        errors.push(
          `Row ${index + 1}: Missing required fields. Required: name, email, company, role.`,
        );
        continue;
      }
      try {
        const contact = await this.create({
          name: row.name,
          email: row.email,
          company: row.company,
          role: row.role,
          phone: row.phone,
          linkedin: row.linkedin,
          notes: row.notes,
        });
        createdContacts.push(contact);
      } catch (error: unknown) {
        let errorMsg: string;
        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message: unknown }).message === 'string'
        ) {
          errorMsg = (error as { message: string }).message;
        } else {
          errorMsg = 'Unknown error occurred';
        }
        errors.push(`Row ${index + 1}: ${errorMsg}`);
      }
    }
    return { createdContacts, errors };
  }
}
