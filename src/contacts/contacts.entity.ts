import { ApiProperty } from '@nestjs/swagger';

export class Contact {
  @ApiProperty({
    description: 'The unique identifier of the contact',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The full name of the contact',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The email address of the contact',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The company where the contact works',
    example: 'Acme Corporation',
  })
  company: string;

  @ApiProperty({
    description: 'The role/position of the contact',
    example: 'Software Engineer',
  })
  role: string;

  @ApiProperty({
    description: 'The phone number of the contact',
    example: '+1234567890',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'The LinkedIn profile URL of the contact',
    example: 'https://linkedin.com/in/johndoe',
    required: false,
  })
  linkedin?: string;

  @ApiProperty({
    description: 'Additional notes about the contact',
    example: 'Met at tech conference',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'The timestamp when the contact was created',
  })
  created_at: string;

  @ApiProperty({
    description: 'The timestamp when the contact was last updated',
    required: false,
  })
  updated_at?: string;
}
