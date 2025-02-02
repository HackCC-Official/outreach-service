import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'The full name of the contact',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    description: 'The email address of the contact',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'The company where the contact works',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsNotEmpty({ message: 'Company is required' })
  company: string;

  @ApiProperty({
    description: 'The role/position of the contact',
    example: 'Software Engineer',
  })
  @IsString()
  @IsNotEmpty({ message: 'Role is required' })
  role: string;

  @ApiPropertyOptional({
    description: 'The phone number of the contact',
    example: '1234567890',
  })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'The LinkedIn profile URL of the contact',
    example: 'https://linkedin.com/in/johndoe',
  })
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

// UpdateContactDto makes all fields optional
export class UpdateContactDto extends PartialType(CreateContactDto) {}
