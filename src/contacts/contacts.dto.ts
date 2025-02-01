import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  OmitType,
} from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsUrl,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'The full name of the contact',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The email address of the contact',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The company where the contact works',
    example: 'Acme Corporation',
  })
  @IsString()
  company: string;

  @ApiProperty({
    description: 'The role/position of the contact',
    example: 'Software Engineer',
  })
  @IsString()
  role: string;

  @ApiPropertyOptional({
    description: 'The phone number of the contact',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'The LinkedIn profile URL of the contact',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsUrl()
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the contact',
    example: 'Met at tech conference',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

// UpdateContactDto makes all fields optional by extending PartialType
export class UpdateContactDto extends PartialType(
  OmitType(CreateContactDto, [] as const),
) {}
