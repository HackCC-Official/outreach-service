import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'The email address of the contact',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'The domain name extracted from email',
    example: 'example.com',
  })
  @IsString()
  @IsNotEmpty({ message: 'Domain name is required' })
  domain_name: string;

  @ApiProperty({
    description: 'The organization/company name',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsNotEmpty({ message: 'Organization is required' })
  organization: string;

  @ApiPropertyOptional({
    description: 'The country of the contact',
    example: 'United States',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'The state/province of the contact',
    example: 'California',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'The city of the contact',
    example: 'San Francisco',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'The postal code of the contact',
    example: '94105',
  })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiPropertyOptional({
    description: 'The street address of the contact',
    example: '123 Main St',
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({
    description: 'Confidence score of the contact data',
    example: 0.95,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidence_score?: number;

  @ApiPropertyOptional({
    description: 'Type of contact',
    example: 'Business',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Number of sources this contact was found in',
    example: 3,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  number_of_sources?: number;

  @ApiPropertyOptional({
    description: 'Pattern used to identify this contact',
    example: 'firstname.lastname@domain.com',
  })
  @IsString()
  @IsOptional()
  pattern?: string;

  @ApiProperty({
    description: 'First name of the contact',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  first_name: string;

  @ApiProperty({
    description: 'Last name of the contact',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  last_name: string;

  @ApiPropertyOptional({
    description: 'Department of the contact',
    example: 'Engineering',
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({
    description: 'Position/role of the contact',
    example: 'Software Engineer',
  })
  @IsString()
  @IsNotEmpty({ message: 'Position is required' })
  position: string;

  @ApiPropertyOptional({
    description: 'Twitter handle of the contact',
    example: '@johndoe',
  })
  @IsString()
  @Matches(/^@[A-Za-z0-9_]{1,15}$/, {
    message: 'Invalid Twitter handle format',
  })
  @IsOptional()
  twitter_handle?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn URL of the contact',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsString()
  @Matches(/^https:\/\/(?:www\.)?linkedin\.com\/.*$/, {
    message: 'Invalid LinkedIn URL format',
  })
  @IsOptional()
  linkedin_url?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the contact',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'Type of company',
    example: 'Corporation',
  })
  @IsString()
  @IsOptional()
  company_type?: string;

  @ApiPropertyOptional({
    description: 'Industry of the company',
    example: 'Technology',
  })
  @IsString()
  @IsOptional()
  industry?: string;
}

// UpdateContactDto makes all fields optional
export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional({
    description: 'Whether the contact has been contacted',
    example: false,
    default: false,
  })
  @IsOptional()
  been_contacted?: boolean;
}
