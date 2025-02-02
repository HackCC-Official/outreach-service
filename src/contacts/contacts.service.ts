import { Injectable } from '@nestjs/common';
import { Contact } from './contacts.entity';
import { CreateContactDto, UpdateContactDto } from './contacts.dto';
import {
  ContactNotFoundException,
  DuplicateContactException,
  InvalidContactDataException,
} from './contacts.exceptions';
import { supabase } from '../config/supabase.config';
import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';

@Injectable()
export class ContactsService {
  private readonly TABLE_NAME = 'Contacts';

  /**
   * Create a new contact
   * @param createContactDto - The contact data to create
   * @returns The created contact
   */
  async create(createContactDto: CreateContactDto): Promise<Contact> {
    // Check for duplicate email
    const {
      data: existingContact,
    }: PostgrestSingleResponse<Pick<Contact, 'email'>> = await supabase
      .from(this.TABLE_NAME)
      .select('email')
      .eq('email', createContactDto.email.toLowerCase())
      .single();

    if (existingContact) {
      throw new DuplicateContactException(createContactDto.email);
    }

    const { data, error }: PostgrestSingleResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .insert([
        {
          ...createContactDto,
          email: createContactDto.email.toLowerCase(),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw new InvalidContactDataException([
        error?.message || 'Failed to create contact',
      ]);
    }

    return data;
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
    const { data, error }: PostgrestSingleResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new ContactNotFoundException(id);
    }

    return data;
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
    // Check if contact exists
    await this.findOne(id);

    // Check for duplicate email if email is being updated
    if (updateContactDto.email !== undefined) {
      const {
        data: existingContact,
      }: PostgrestSingleResponse<Pick<Contact, 'id'>> = await supabase
        .from(this.TABLE_NAME)
        .select('id')
        .eq('email', updateContactDto.email.toLowerCase())
        .neq('id', id)
        .single();

      if (existingContact) {
        throw new DuplicateContactException(updateContactDto.email);
      }
    }

    const { data, error }: PostgrestSingleResponse<Contact> = await supabase
      .from(this.TABLE_NAME)
      .update({
        ...updateContactDto,
        email: updateContactDto.email?.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new InvalidContactDataException([
        error?.message || 'Failed to update contact',
      ]);
    }

    return data;
  }

  /**
   * Delete a contact by ID
   * @param id - The contact ID
   * @returns void
   */
  async remove(id: number): Promise<void> {
    // Check if contact exists
    await this.findOne(id);

    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      throw new InvalidContactDataException([error.message]);
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
      throw new InvalidContactDataException([error.message]);
    }

    return data || [];
  }
}
