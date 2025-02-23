import { ApiProperty } from '@nestjs/swagger';

export class Contact {
  @ApiProperty({
    description: 'The unique identifier of the contact',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The email address of the contact',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The domain name extracted from email',
    example: 'example.com',
  })
  domain_name: string;

  @ApiProperty({
    description: 'The organization/company name',
    example: 'Acme Corporation',
  })
  organization: string;

  @ApiProperty({
    description: 'The country of the contact',
    example: 'United States',
    required: false,
  })
  country?: string;

  @ApiProperty({
    description: 'The state/province of the contact',
    example: 'California',
    required: false,
  })
  state?: string;

  @ApiProperty({
    description: 'The city of the contact',
    example: 'San Francisco',
    required: false,
  })
  city?: string;

  @ApiProperty({
    description: 'The postal code of the contact',
    example: '94105',
    required: false,
  })
  postal_code?: string;

  @ApiProperty({
    description: 'The street address of the contact',
    example: '123 Main St',
    required: false,
  })
  street?: string;

  @ApiProperty({
    description: 'Confidence score of the contact data',
    example: 0.95,
    required: false,
  })
  confidence_score?: number;

  @ApiProperty({
    description: 'Type of contact',
    example: 'Business',
    required: false,
  })
  type?: string;

  @ApiProperty({
    description: 'Number of sources this contact was found in',
    example: 3,
    required: false,
  })
  number_of_sources?: number;

  @ApiProperty({
    description: 'Pattern used to identify this contact',
    example: 'firstname.lastname@domain.com',
    required: false,
  })
  pattern?: string;

  @ApiProperty({
    description: 'First name of the contact',
    example: 'John',
  })
  first_name: string;

  @ApiProperty({
    description: 'Last name of the contact',
    example: 'Doe',
  })
  last_name: string;

  @ApiProperty({
    description: 'Department of the contact',
    example: 'Engineering',
    required: false,
  })
  department?: string;

  @ApiProperty({
    description: 'Position/role of the contact',
    example: 'Software Engineer',
  })
  position: string;

  @ApiProperty({
    description: 'Twitter handle of the contact',
    example: '@johndoe',
    required: false,
  })
  twitter_handle?: string;

  @ApiProperty({
    description: 'LinkedIn URL of the contact',
    example: 'https://linkedin.com/in/johndoe',
    required: false,
  })
  linkedin_url?: string;

  @ApiProperty({
    description: 'Phone number of the contact',
    example: '+1234567890',
    required: false,
  })
  phone_number?: string;

  @ApiProperty({
    description: 'Type of company',
    example: 'Corporation',
    required: false,
  })
  company_type?: string;

  @ApiProperty({
    description: 'Industry of the company',
    example: 'Technology',
    required: false,
  })
  industry?: string;

  @ApiProperty({
    description: 'Whether the contact has been contacted',
    example: false,
    default: false,
  })
  been_contacted: boolean;

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
