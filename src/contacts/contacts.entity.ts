import { ApiProperty } from '@nestjs/swagger';

export class Contact {
  @ApiProperty({
    description: 'The unique identifier of the contact',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The liaison assigned to this contact',
    example: 'Jane Smith',
    required: false,
  })
  liaison?: string;

  @ApiProperty({
    description: 'Current status of the contact engagement',
    example: 'Active',
    required: false,
  })
  status?: string;

  @ApiProperty({
    description: 'Method of meeting with the contact',
    example: 'Video Call',
    required: false,
  })
  meeting_method?: string;

  @ApiProperty({
    description: 'The company name of the contact',
    example: 'Acme Corporation',
    required: false,
  })
  company?: string;

  @ApiProperty({
    description: 'Full name of the contact',
    example: 'John Doe',
    required: false,
  })
  contact_name?: string;

  @ApiProperty({
    description: 'Position/role of the contact',
    example: 'Software Engineer',
    required: false,
  })
  position?: string;

  @ApiProperty({
    description: 'The email address of the contact',
    example: 'john.doe@example.com',
  })
  email_address: string;

  @ApiProperty({
    description: 'LinkedIn URL of the contact',
    example: 'https://linkedin.com/in/johndoe',
    required: false,
  })
  linkedin?: string;

  @ApiProperty({
    description: 'Phone number of the contact',
    example: '+1234567890',
    required: false,
  })
  phone_number?: string;

  @ApiProperty({
    description: 'The country of the contact',
    example: 'United States',
    required: false,
  })
  country?: string;

  @ApiProperty({
    description: 'Company website URL',
    example: 'https://example.com',
    required: false,
  })
  website?: string;

  @ApiProperty({
    description: 'Confidence score of the contact data (1-100)',
    example: 95,
    required: false,
  })
  confidence_score?: number;
}
