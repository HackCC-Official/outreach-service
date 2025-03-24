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
      .eq('email_address', this.normalizeEmail(email));
    if (excludeId !== undefined) {
      query.neq('id', excludeId);
    }
    const { data, error } = await query;

    // If we have an error, it's not about duplicate emails
    if (error) {
      throw new InvalidContactDataException([error.message]);
    }

    // If we have data and it's not empty, we found a duplicate
    if (data && data.length > 0) {
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
      const errorMessage: string =
        typeof result.error?.message === 'string'
          ? result.error.message
          : fallbackMessage;
      throw new InvalidContactDataException([errorMessage]);
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

    await this.checkDuplicateEmail(createContactDto.email_address);

    const contactData = {
      ...createContactDto,
      email_address: this.normalizeEmail(createContactDto.email_address),
      created_at: new Date().toISOString(),
    };

    const createResult: PostgrestSingleResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .insert([contactData])
      .select()
      .single();

    return this.extractSingleResult(createResult, 'Failed to create contact');
  }

  /**
   * Find all contacts with optional pagination
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @param liaison - Optional filter for liaison
   * @returns Array of contacts and total count
   */
  async findAll(
    skip = 0,
    take = 10,
    liaison?: string,
  ): Promise<[Contact[], number]> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from(this.TABLE_NAME)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (liaison) {
      query = query.eq('liaison', liaison);
    }

    const { data, error, count }: PostgrestResponse<Contact> =
      await query.range(skip, skip + take - 1);

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

    if (updateContactDto.email_address !== undefined) {
      await this.checkDuplicateEmail(updateContactDto.email_address, id);
    }

    const updateData: Partial<Contact> = {
      ...updateContactDto,
    };
    if (updateContactDto.email_address !== undefined) {
      updateData.email_address = this.normalizeEmail(
        updateContactDto.email_address,
      );
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
   * Search contacts by name, email, company, etc.
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
        `contact_name.ilike.${searchQuery},email_address.ilike.${searchQuery},company.ilike.${searchQuery},position.ilike.${searchQuery}`,
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
      Liaison?: string;
      Status?: string;
      'Meeting Method'?: string;
      Company?: string;
      'Contact Name'?: string;
      Position?: string;
      'Email address'?: string;
      LinkedIn?: string;
      'Phone Number'?: string;
      Country?: string;
      Website?: string;
      'Confidence Score'?: string;
    }

    let rows: ParsedContactRow[];
    try {
      rows = parse(fileBuffer, {
        columns: true,
        trim: true,
        skip_empty_lines: true,
        relaxColumnCount: true,
      }) as ParsedContactRow[];
      console.log('Parsed CSV rows:', JSON.stringify(rows[0], null, 2));
    } catch (error: unknown) {
      console.error('CSV parsing error:', error);
      const errorMessage: string =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InvalidContactDataException([
        `Failed to parse CSV file: ${errorMessage}`,
      ]);
    }

    const createdContacts: Contact[] = [];
    const errors: string[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      try {
        console.log(
          `Processing row ${index + 1}:`,
          JSON.stringify(row, null, 2),
        );

        if (!row['Email address']) {
          errors.push(
            `Row ${index + 1}: Missing required field: Email address`,
          );
          continue;
        }

        const contactData = {
          liaison: row['Liaison'],
          status: row['Status'],
          meeting_method: row['Meeting Method'],
          company: row['Company'],
          contact_name: row['Contact Name'],
          position: row['Position'],
          email_address: row['Email address'],
          linkedin: row['LinkedIn'],
          phone_number: row['Phone Number'],
          country: row['Country'],
          website: row['Website'],
          confidence_score: row['Confidence Score']
            ? parseFloat(row['Confidence Score'])
            : undefined,
        };

        console.log(
          `Processed contact data for row ${index + 1}:`,
          JSON.stringify(contactData, null, 2),
        );

        const contact = await this.create(contactData as CreateContactDto);
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

  /**
   * Starts the processing of contacts from a CSV file buffer in the background.
   * This method returns immediately while processing continues asynchronously.
   * @param fileBuffer - The CSV file buffer uploaded by the user
   */
  processContactsUpload(fileBuffer: Buffer): void {
    this.uploadContacts(fileBuffer)
      .then(({ createdContacts, errors }) => {
        this.logger.log(
          `CSV processing completed: ${createdContacts.length} contacts created with ${errors.length} errors`,
        );
        if (errors.length > 0) {
          this.logger.warn(`Upload errors: ${JSON.stringify(errors)}`);
        }
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown error processing CSV';
        this.logger.error(`Failed to process CSV: ${errorMessage}`);
      });
  }
}
