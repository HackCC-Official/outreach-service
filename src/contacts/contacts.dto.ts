import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateContactDto {
  @ApiPropertyOptional({
    description: 'The liaison assigned to this contact',
    example: 'Jane Smith',
  })
  @IsString()
  @IsOptional()
  liaison?: string;

  @ApiPropertyOptional({
    description: 'Current status of the contact engagement',
    example: 'Active',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Method of meeting with the contact',
    example: 'Video Call',
  })
  @IsString()
  @IsOptional()
  meeting_method?: string;

  @ApiPropertyOptional({
    description: 'The company name of the contact',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({
    description: 'Full name of the contact',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  contact_name?: string;

  @ApiPropertyOptional({
    description: 'Position/role of the contact',
    example: 'Software Engineer',
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({
    description: 'The email address of the contact',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email_address: string;

  @ApiPropertyOptional({
    description: 'LinkedIn URL of the contact',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsString()
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the contact',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'The country of the contact',
    example: 'United States',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://example.com',
  })
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'Confidence score of the contact data (1-100)',
    example: 95,
  })
  @IsNumber()
  @Min(1, { message: 'Confidence score must be at least 1' })
  @Max(100, { message: 'Confidence score must not exceed 100' })
  @IsOptional()
  confidence_score?: number;
}

// UpdateContactDto makes all fields optional
export class UpdateContactDto extends PartialType(CreateContactDto) {}
