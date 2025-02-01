import { Injectable } from '@nestjs/common';
import { Contact } from './contacts.entity';
import { CreateContactDto, UpdateContactDto } from './contacts.dto';
import {
  ContactNotFoundException,
  DuplicateContactException,
  InvalidContactDataException,
} from './contacts.exceptions';

@Injectable()
export class ContactsService {
  // In-memory store for contacts
  private contacts: Contact[] = [];
  private currentId = 1;

  /**
   * Create a new contact
   * @param createContactDto - The contact data to create
   * @returns The created contact
   */
  create(createContactDto: CreateContactDto): Promise<Contact> {
    // Validate required fields
    if (!createContactDto || !createContactDto.email) {
      throw new InvalidContactDataException(['Email is required']);
    }

    if (!createContactDto.name) {
      throw new InvalidContactDataException(['Name is required']);
    }

    if (!createContactDto.company) {
      throw new InvalidContactDataException(['Company is required']);
    }

    if (!createContactDto.role) {
      throw new InvalidContactDataException(['Role is required']);
    }

    // Check for duplicate email
    const existingContact = this.contacts.find(
      (c) => c.email.toLowerCase() === createContactDto.email.toLowerCase(),
    );
    if (existingContact) {
      throw new DuplicateContactException(createContactDto.email);
    }

    const contact = new Contact();
    Object.assign(contact, {
      id: this.currentId++,
      ...createContactDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.contacts.push(contact);
    return Promise.resolve(contact);
  }

  /**
   * Find all contacts with optional pagination
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Array of contacts and total count
   */
  findAll(skip = 0, take = 10): Promise<[Contact[], number]> {
    const total = this.contacts.length;
    const data = this.contacts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(skip, skip + take);
    return Promise.resolve([data, total]);
  }

  /**
   * Find a contact by ID
   * @param id - The contact ID
   * @returns The found contact or throws ContactNotFoundException
   */
  findOne(id: number): Promise<Contact> {
    const contact = this.contacts.find((c) => c.id === id);
    if (!contact) {
      throw new ContactNotFoundException(id);
    }
    return Promise.resolve(contact);
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
    const contact = await this.findOne(id);

    // Check for duplicate email if email is being updated
    if (updateContactDto.email !== undefined) {
      const existingContact = this.contacts.find(
        (c) =>
          c.email.toLowerCase() === updateContactDto.email!.toLowerCase() &&
          c.id !== id,
      );
      if (existingContact) {
        throw new DuplicateContactException(updateContactDto.email);
      }
    }

    Object.assign(contact, {
      ...updateContactDto,
      updatedAt: new Date(),
    });
    return Promise.resolve(contact);
  }

  /**
   * Delete a contact by ID
   * @param id - The contact ID
   * @returns void
   */
  remove(id: number): Promise<void> {
    const index = this.contacts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new ContactNotFoundException(id);
    }
    this.contacts.splice(index, 1);
    return Promise.resolve();
  }

  /**
   * Search contacts by name, email, or company
   * @param query - The search query
   * @returns Array of matching contacts
   */
  search(query: string): Promise<Contact[]> {
    if (!query || query.trim().length === 0) {
      throw new InvalidContactDataException(['Search query cannot be empty']);
    }

    const lowercaseQuery = query.toLowerCase();
    const results = this.contacts
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(lowercaseQuery) ||
          contact.email.toLowerCase().includes(lowercaseQuery) ||
          contact.company.toLowerCase().includes(lowercaseQuery),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
    return Promise.resolve(results);
  }
}
