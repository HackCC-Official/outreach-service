import { Injectable, Logger } from '@nestjs/common';
import { Contact } from './contacts.entity';
import { CreateContactDto, UpdateContactDto } from './contacts.dto';
import {
  DuplicateContactException,
  InvalidContactDataException,
} from './contacts.exceptions';
import { SupabaseService } from '../auth/supabase.service';
import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

@Injectable()
export class ContactsService {
  private readonly TABLE_NAME = 'outreach_contacts';
  private readonly logger = new Logger(ContactsService.name);

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
   * Checks for duplicate email in the Contacts table.
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
    const supabase = this.supabaseService.getClient();
    this.logger.debug(
      `Creating contact using environment: ${this.supabaseService.getCurrentEnvironment()}`,
    );

    // Check for duplicate email using helper method
    await this.checkDuplicateEmail(createContactDto.email);

    const createResult: PostgrestSingleResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .insert([
        {
          ...createContactDto,
          email: this.normalizeEmail(createContactDto.email),
          created_at: new Date().toISOString(),
          been_contacted: false,
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
    const supabase = this.supabaseService.getClient();

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
    const supabase = this.supabaseService.getClient();

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
    const supabase = this.supabaseService.getClient();

    // If email is being updated, check for duplicates using helper method
    if (updateContactDto.email !== undefined) {
      await this.checkDuplicateEmail(updateContactDto.email, id);
    }

    // Build update data object, normalizing email if provided.
    const updateData: Partial<Contact> = {
      ...updateContactDto,
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
    const supabase = this.supabaseService.getClient();

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
    const supabase = this.supabaseService.getClient();

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
    const supabase = this.supabaseService.getClient();

    interface ParsedContactRow {
      'Email address': string;
      'Domain name': string;
      Organization: string;
      Country: string;
      State: string;
      City: string;
      'Postal code': string;
      Street: string;
      'Confidence score': string;
      Type: string;
      'Number of sources': string;
      Pattern: string;
      'First name': string;
      'Last name': string;
      Department: string;
      Position: string;
      'Twitter handle': string;
      'LinkedIn URL': string;
      'Phone number': string;
      'Company type': string;
      Industry: string;
    }

    let rows: ParsedContactRow[];
    try {
      rows = parse(fileBuffer, {
        columns: true,
        trim: true,
        skip_empty_lines: true,
        relaxColumnCount: true,
      });
      console.log('Parsed CSV rows:', JSON.stringify(rows[0], null, 2));
    } catch (error) {
      console.error('CSV parsing error:', error);
      throw new InvalidContactDataException([
        `Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    }

    const createdContacts: Contact[] = [];
    const errors: string[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      try {
        // Log the raw row data
        console.log(
          `Processing row ${index + 1}:`,
          JSON.stringify(row, null, 2),
        );

        if (
          !row['Email address'] ||
          !row['First name'] ||
          !row['Last name'] ||
          !row['Position'] ||
          !row['Organization']
        ) {
          const missingFields = [
            !row['Email address'] ? 'Email address' : null,
            !row['First name'] ? 'First name' : null,
            !row['Last name'] ? 'Last name' : null,
            !row['Position'] ? 'Position' : null,
            !row['Organization'] ? 'Organization' : null,
          ].filter(Boolean);

          errors.push(
            `Row ${index + 1}: Missing required fields: ${missingFields.join(', ')}`,
          );
          continue;
        }

        const contactData = {
          email: row['Email address'],
          domain_name:
            row['Domain name'] ||
            new URL(`http://${row['Email address'].split('@')[1]}`).hostname,
          organization: row['Organization'],
          country: row['Country'],
          state: row['State'],
          city: row['City'],
          postal_code: row['Postal code'],
          street: row['Street'],
          confidence_score: row['Confidence score']
            ? parseFloat(row['Confidence score'])
            : undefined,
          type: row['Type'],
          number_of_sources: row['Number of sources']
            ? parseInt(row['Number of sources'], 10)
            : undefined,
          pattern: row['Pattern'],
          first_name: row['First name'],
          last_name: row['Last name'],
          department: row['Department'],
          position: row['Position'],
          twitter_handle: row['Twitter handle'] || undefined,
          linkedin_url: row['LinkedIn URL'] || undefined,
          phone_number: row['Phone number'] || undefined,
          company_type: row['Company type'],
          industry: row['Industry'],
        };

        // Log the processed contact data
        console.log(
          `Processed contact data for row ${index + 1}:`,
          JSON.stringify(contactData, null, 2),
        );

        const contact = await this.create(contactData);
        createdContacts.push(contact);
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === 'object') {
          const errorObj = error as { message?: unknown };
          if (errorObj.message && typeof errorObj.message === 'string') {
            errorMessage = errorObj.message;
          }
        }
        errors.push(`Row ${index + 1}: ${errorMessage}`);
      }
    }
    return { createdContacts, errors };
  }
}
